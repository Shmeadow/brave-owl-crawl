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
    let userRooms: RoomData[] = [];

    if (session?.user?.id) {
      // Fetch rooms created by the user
      const { data: createdRooms, error: createdError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_members(user_id),
          creator:profiles!creator_id(first_name, last_name)
        `)
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: true });

      if (createdError) {
        toast.error("Error fetching your created rooms: " + createdError.message);
        console.error("Error fetching created rooms:", createdError);
      } else {
        // Mark created rooms as 'is_member: true' as the creator is implicitly a member
        userRooms = [...(createdRooms as RoomData[]).map(room => ({ ...room, is_member: true }))];
      }

      // Fetch rooms where the user is a member (excluding rooms they created)
      const { data: memberEntries, error: memberError } = await supabase
        .from('room_members')
        .select(`
          room_id,
          rooms (
            *,
            room_members(user_id),
            creator:profiles!creator_id(first_name, last_name)
          )
        `)
        .eq('user_id', session.user.id);

      if (memberError) {
        toast.error("Error fetching rooms you joined: " + memberError.message);
        console.error("Error fetching joined rooms:", memberError);
      } else {
        const joinedRooms = memberEntries
          .map((entry: any) => ({ ...entry.rooms, is_member: true }))
          .filter((room: RoomData) => room.creator_id !== session.user.id); // Exclude rooms already fetched as created

        userRooms = [...userRooms, ...joinedRooms];
      }

      // Fetch public rooms that the user is NOT a member of and did NOT create
      const { data: publicRooms, error: publicRoomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_members(user_id),
          creator:profiles!creator_id(first_name, last_name)
        `)
        .eq('type', 'public')
        .is('deleted_at', null)
        .not('creator_id', 'eq', session.user.id)
        .not('room_members.user_id', 'eq', session.user.id); // Filter out rooms where user is already a member

      if (publicRoomsError) {
        console.error("Error fetching public rooms:", publicRoomsError);
      } else {
        const newPublicRooms = (publicRooms as RoomData[]).map(room => ({ ...room, is_member: false }));
        userRooms = [...userRooms, ...newPublicRooms];
      }

      // Deduplicate rooms in case of any overlap
      const uniqueRooms = Array.from(new Map(userRooms.map(room => [room.id, room])).values());
      setRooms(uniqueRooms);

    } else {
      // If not logged in, fetch only public rooms
      const { data: publicRooms, error: publicRoomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_members(user_id),
          creator:profiles!creator_id(first_name, last_name)
        `)
        .eq('type', 'public')
        .is('deleted_at', null);

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
  }, [fetchRooms]);

  return { rooms, loading, fetchRooms };
}