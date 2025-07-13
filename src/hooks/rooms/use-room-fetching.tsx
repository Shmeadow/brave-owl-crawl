"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";

export function useRoomFetching() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (authLoading || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let allFetchedRooms: RoomData[] = [];
    const nowIso = new Date().toISOString(); // Get current time in ISO format

    if (session?.user?.id) {
      // Fetch rooms created by the user
      const { data: createdRooms, error: createdError } = await supabase
        .from('rooms')
        .select(`
          id,
          creator_id,
          name,
          created_at,
          background_url,
          is_video_background,
          password_hash,
          type,
          closes_at,
          deleted_at,
          description,
          profiles!creator_id(first_name, last_name)
        `)
        .eq('creator_id', session.user.id)
        .is('deleted_at', null) // Ensure not soft-deleted
        .gt('closes_at', nowIso) // Ensure not expired
        .order('created_at', { ascending: true });

      if (createdError) {
        toast.error("Error fetching your created rooms: " + createdError.message);
        console.error("Error fetching created rooms:", createdError);
      } else {
        allFetchedRooms = [...(createdRooms as RoomData[]).map(room => ({ ...room, is_member: true }))];
      }

      // Fetch rooms where the user is a member (excluding rooms they created)
      const { data: memberEntries, error: memberError } = await supabase
        .from('room_members')
        .select(`
          room_id,
          rooms (
            id,
            creator_id,
            name,
            created_at,
            background_url,
            is_video_background,
            password_hash,
            type,
            closes_at,
            deleted_at,
            description,
            profiles!creator_id(first_name, last_name)
          )
        `)
        .eq('user_id', session.user.id);

      if (memberError) {
        toast.error("Error fetching rooms you joined: " + memberError.message);
        console.error("Error fetching joined rooms:", memberError);
      } else {
        const joinedRooms = memberEntries
          .map((entry: any) => ({ ...entry.rooms, is_member: true }))
          .filter((room: RoomData) => room.creator_id !== session.user.id && room.deleted_at === null && room.closes_at && room.closes_at > nowIso); // Filter out expired/deleted
        allFetchedRooms = [...allFetchedRooms, ...joinedRooms];
      }

      // Fetch public rooms that the user is NOT a member of and did NOT create
      const { data: publicRooms, error: publicRoomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          creator_id,
          name,
          created_at,
          background_url,
          is_video_background,
          password_hash,
          type,
          closes_at,
          deleted_at,
          description,
          profiles!creator_id(first_name, last_name)
        `)
        .eq('type', 'public')
        .is('deleted_at', null)
        .gt('closes_at', nowIso); // Ensure not expired

      if (publicRoomsError) {
        console.error("Error fetching public rooms:", publicRoomsError);
      } else {
        const newPublicRooms = (publicRooms as RoomData[]).map(room => ({ ...room, is_member: false }));
        allFetchedRooms = [...allFetchedRooms, ...newPublicRooms];
      }

      // Deduplicate rooms and filter out those the user is already a member of (from public list)
      const uniqueRoomsMap = new Map<string, RoomData>();
      for (const room of allFetchedRooms) {
        // If a room is already marked as a member, keep that status
        // Otherwise, add it or update if it's a public room not yet seen
        const existing = uniqueRoomsMap.get(room.id);
        if (!existing || room.is_member) { // Prioritize member status
          uniqueRoomsMap.set(room.id, room);
        }
      }
      
      // Filter out public rooms if the user is already a member or creator
      const finalRooms = Array.from(uniqueRoomsMap.values()).filter(room => {
        if (room.type === 'public' && !room.is_member && room.creator_id !== session.user.id) {
          // Check if user is a member via room_members table (more reliable)
          const isAlreadyMember = allFetchedRooms.some(
            r => r.id === room.id && r.is_member && r.creator_id !== session.user.id
          );
          return !isAlreadyMember;
        }
        return true;
      });

      setRooms(finalRooms);

    } else {
      // If not logged in, fetch only public rooms
      const { data: publicRooms, error: publicRoomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          creator_id,
          name,
          created_at,
          background_url,
          is_video_background,
          password_hash,
          type,
          closes_at,
          deleted_at,
          description,
          profiles!creator_id(first_name, last_name)
        `)
        .eq('type', 'public')
        .is('deleted_at', null)
        .gt('closes_at', nowIso); // Ensure not expired

      if (publicRoomsError) {
        console.error("Error fetching public rooms for guest:", publicRoomsError);
        setRooms([]);
      } else {
        setRooms(publicRooms as RoomData[]);
      }
    }
    
    setLoading(false);
  }, [supabase, session, authLoading]);

  useEffect(() => {
    fetchRooms();

    if (!supabase || !session?.user?.id) return;

    // Subscribe to changes in the 'rooms' table
    const roomsChannel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'UPDATE') {
          const updatedRoom = newRecord as RoomData;
          // If the room is soft-deleted, remove it from the list
          if (updatedRoom.deleted_at) {
            setRooms(prev => prev.filter(r => r.id !== updatedRoom.id));
          } else {
            // Otherwise, update the existing room data
            setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r));
          }
        } else if (eventType === 'DELETE') { // For hard deletes
          setRooms(prev => prev.filter(r => r.id !== (oldRecord as any).id));
        } else if (eventType === 'INSERT') {
          // A full fetch is safer here to ensure all joins and permissions are correct.
          fetchRooms();
        }
      })
      .subscribe();

    // Subscribe to changes in the 'room_members' table
    const roomMembersChannel = supabase
      .channel('public:room_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, (payload) => {
        // Membership changes are complex to handle optimistically, a refetch is safer.
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(roomMembersChannel);
    };
  }, [fetchRooms, supabase, session]);

  return { rooms, loading, fetchRooms, setRooms };
}