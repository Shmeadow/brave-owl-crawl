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
    let allRoomsMap = new Map<string, RoomData>(); // Use a Map for deduplication

    if (session?.user?.id) {
      const userId = session.user.id;

      // 1. Fetch rooms created by the user
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
        .eq('creator_id', userId)
        .is('deleted_at', null)
        .gt('closes_at', nowIso);

      if (createdError) {
        console.error("Error fetching created rooms:", createdError);
        toast.error("Failed to load your created rooms.");
      } else {
        (createdRooms as any[]).forEach(room => {
          const processedRoom: RoomData = {
            ...room,
            is_member: true, // Creator is always a member
            profiles: Array.isArray(room.profiles) ? room.profiles[0] : room.profiles,
          };
          allRoomsMap.set(room.id, processedRoom);
        });
      }

      // 2. Fetch rooms where the user is a member
      const { data: memberRooms, error: memberError } = await supabase
        .from('room_members')
        .select(`
          room_id,
          rooms(
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
        .eq('user_id', userId)
        .is('rooms.deleted_at', null) // Filter on the joined room
        .gt('rooms.closes_at', nowIso); // Filter on the joined room

      if (memberError) {
        console.error("Error fetching member rooms:", memberError);
        toast.error("Failed to load your joined rooms.");
      } else {
        (memberRooms as any[]).forEach(memberEntry => {
          const room = memberEntry.rooms;
          if (room && !allRoomsMap.has(room.id)) { // Only add if not already added as a created room
            const processedRoom: RoomData = {
              ...room,
              is_member: true,
              profiles: Array.isArray(room.profiles) ? room.profiles[0] : room.profiles,
            };
            allRoomsMap.set(room.id, processedRoom);
          }
        });
      }

      // 3. Fetch public rooms (that the user is not already a member of or creator of)
      const { data: publicRooms, error: publicError } = await supabase
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

      if (publicError) {
        console.error("Error fetching public rooms:", publicError);
      } else {
        (publicRooms as any[]).forEach(room => {
          if (!allRoomsMap.has(room.id)) { // Only add if not already in the map
            const processedRoom: RoomData = {
              ...room,
              is_member: false, // Public rooms are not "memberships" in the same way
              profiles: Array.isArray(room.profiles) ? room.profiles[0] : room.profiles,
            };
            allRoomsMap.set(room.id, processedRoom);
          }
        });
      }

      // Convert map values to array and sort
      const finalRooms = Array.from(allRoomsMap.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setRooms(finalRooms);

    } else {
      // Guest mode: fetch only public rooms
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
        .gt('closes_at', nowIso)
        .order('created_at', { ascending: true });

      if (publicRoomsError) {
        console.error("Error fetching public rooms for guest:", publicRoomsError);
        setRooms([]);
      } else {
        setRooms((publicRoomsData as any[]).map(room => ({
          ...room,
          is_member: false,
          profiles: Array.isArray(room.profiles) ? room.profiles[0] : room.profiles,
        })));
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
        // A full fetch is safer here to ensure all joins and permissions are correct.
        fetchRooms();
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