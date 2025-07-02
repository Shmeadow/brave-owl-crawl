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
    let allRooms: RoomData[] = [];

    // Fetch public rooms
    const { data: publicRooms, error: publicError } = await supabase
      .from('rooms')
      .select('*, room_members(user_id)')
      .eq('is_public', true)
      .order('created_at', { ascending: true });

    if (publicError) {
      toast.error("Error fetching public rooms: " + publicError.message);
      console.error("Error fetching public rooms:", publicError);
    } else {
      allRooms = publicRooms.map(room => ({
        ...room,
        is_member: session?.user?.id ? room.room_members.some((m: { user_id: string }) => m.user_id === session.user.id) : false, // Fixed 'any' type
      })) as RoomData[];
    }

    // If logged in, fetch rooms created by user and rooms user is a member of
    if (session?.user?.id) {
      // Fetch rooms created by the user
      const { data: userCreatedRooms, error: createdError } = await supabase
        .from('rooms')
        .select('*, room_members(user_id)')
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: true });

      if (createdError) {
        toast.error("Error fetching your created rooms: " + createdError.message);
        console.error("Error fetching created rooms:", createdError);
      } else {
        userCreatedRooms.forEach(room => {
          if (!allRooms.some(r => r.id === room.id)) {
            allRooms.push({
              ...room,
              is_member: true,
            } as RoomData);
          } else {
            const existingRoom = allRooms.find(r => r.id === room.id);
            if (existingRoom) existingRoom.is_member = true;
          }
        });
      }

      // Fetch rooms the user is a member of (excluding their own created rooms)
      const { data: memberships, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', session.user.id);

      if (memberError) {
        toast.error("Error fetching room memberships: " + memberError.message);
        console.error("Error fetching memberships:", memberError);
      } else if (memberships) {
        const memberRoomIds = new Set(memberships.map(m => m.room_id));
        
        const { data: memberRooms, error: memberRoomsError } = await supabase
          .from('rooms')
          .select('*, room_members(user_id)')
          .in('id', Array.from(memberRoomIds))
          .order('created_at', { ascending: true });

        if (memberRoomsError) {
          toast.error("Error fetching member rooms: " + memberRoomsError.message);
          console.error("Error fetching member rooms:", memberRoomsError);
        } else if (memberRooms) {
          memberRooms.forEach(room => {
            if (!allRooms.some(r => r.id === room.id)) {
              allRooms.push({ ...room, is_member: true } as RoomData);
            } else {
              const existingRoom = allRooms.find(r => r.id === room.id);
              if (existingRoom) existingRoom.is_member = true;
            }
          });
        }
      }
    }

    allRooms.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setRooms(allRooms);
    setLoading(false);
  }, [supabase, session, authLoading]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, fetchRooms };
}