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
      // Fetch rooms created by the user OR rooms the user is a member of
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_members(user_id),
          creator:profiles!creator_id(first_name, last_name)
        `)
        .or(`creator_id.eq.${session.user.id},room_members.user_id.eq.${session.user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error("Error fetching your rooms: " + error.message);
        console.error("Error fetching rooms:", error);
        userRooms = [];
      } else {
        userRooms = data.map(room => ({
          ...room,
          is_member: room.room_members.some((m: any) => m.user_id === session.user.id) || room.creator_id === session.user.id,
        })) as RoomData[];
      }
    }
    
    setRooms(userRooms);
    setLoading(false);
  }, [supabase, session, authLoading]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, fetchRooms };
}