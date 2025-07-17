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
    const nowIso = new Date().toISOString();

    let myRooms: RoomData[] = [];
    let publicRoomsToExplore: RoomData[] = [];

    if (session?.user?.id) {
      // Fetch rooms created by the user OR rooms where the user is a member
      const { data: userRelatedRooms, error: userRelatedError } = await supabase
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
          profiles!creator_id(first_name, last_name),
          room_members!left(user_id)
        `)
        .or(`creator_id.eq.${session.user.id},room_members.user_id.eq.${session.user.id}`)
        .is('deleted_at', null)
        .gt('closes_at', nowIso)
        .order('created_at', { ascending: true });

      if (userRelatedError) {
        console.error("Error fetching user related rooms:", userRelatedError);
        toast.error("Failed to load your rooms.");
      } else {
        const uniqueMyRooms = new Map<string, RoomData>();
        (userRelatedRooms as any[]).forEach(room => {
          const isMember = room.creator_id === session.user.id || (room.room_members && room.room_members.length > 0);
          uniqueMyRooms.set(room.id, {
            ...room,
            is_member: isMember,
            profiles: room.profiles ? (Array.isArray(room.profiles) ? room.profiles : [room.profiles]) : null,
          });
        });
        myRooms = Array.from(uniqueMyRooms.values());
      }

      // Fetch public rooms that the user is NOT a member of and did NOT create
      const { data: publicExploreRoomsData, error: publicExploreError } = await supabase
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
        .gt('closes_at', nowIso)
        .not('creator_id', 'eq', session.user.id) // Exclude rooms created by current user
        .not('room_members.user_id', 'eq', session.user.id); // Exclude rooms where user is already a member

      if (publicExploreError) {
        console.error("Error fetching public rooms to explore:", publicExploreError);
      } else {
        publicRoomsToExplore = (publicExploreRoomsData as any[]).map(room => ({
          ...room,
          is_member: false,
          profiles: room.profiles ? (Array.isArray(room.profiles) ? room.profiles : [room.profiles]) : null,
        }));
      }

    } else {
      // If not logged in, fetch only public rooms
      const { data: publicRoomsData, error: publicRoomsError } = await supabase
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
        .gt('closes_at', nowIso);

      if (publicRoomsError) {
        console.error("Error fetching public rooms for guest:", publicRoomsError);
        publicRoomsToExplore = [];
      } else {
        publicRoomsToExplore = (publicRoomsData as any[]).map(room => ({
          ...room,
          is_member: false,
          profiles: room.profiles ? (Array.isArray(room.profiles) ? room.profiles : [room.profiles]) : null,
        }));
      }
    }
    
    // Combine and set rooms
    setRooms([...myRooms, ...publicRoomsToExplore]);
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