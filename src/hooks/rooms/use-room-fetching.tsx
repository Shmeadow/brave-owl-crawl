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
    let allFetchedRooms: RoomData[] = [];

    if (session?.user?.id) {
      // 1. Fetch rooms created by the user OR rooms where the user is a member
      const { data: userAssociatedRooms, error: userAssociatedError } = await supabase
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
          room_members(user_id)
        `)
        .or(`creator_id.eq.${session.user.id},room_members.user_id.eq.${session.user.id}`)
        .is('deleted_at', null)
        .gt('closes_at', nowIso)
        .order('created_at', { ascending: true });

      if (userAssociatedError) {
        console.error("Error fetching user associated rooms:", userAssociatedError);
        toast.error("Failed to load your rooms.");
      } else {
        const processedRooms = (userAssociatedRooms as any[]).map(room => ({
          ...room,
          is_member: room.creator_id === session.user.id || (room.room_members && room.room_members.length > 0),
          profiles: Array.isArray(room.profiles) ? room.profiles[0] : room.profiles,
        }));
        allFetchedRooms.push(...processedRooms);
      }

      // 2. Fetch public rooms that the user is NOT a member of and did NOT create
      // This query will fetch all public rooms, and we'll filter out user's rooms client-side.
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
        console.error("Error fetching public rooms:", publicRoomsError);
      } else {
        const publicRooms = (publicRoomsData as any[]).map(room => ({
          ...room,
          is_member: false, // Assume not a member initially, will be overridden by userAssociatedRooms
          profiles: Array.isArray(room.profiles) ? room.profiles[0] : room.profiles,
        }));
        allFetchedRooms.push(...publicRooms);
      }

      // Deduplicate and set is_member flag correctly
      const uniqueRoomsMap = new Map<string, RoomData>();
      allFetchedRooms.forEach(room => {
        const existing = uniqueRoomsMap.get(room.id);
        if (!existing || room.is_member) { // Prioritize if user is a member
          uniqueRoomsMap.set(room.id, room);
        }
      });

      // Filter out public rooms that the user is already a member of or created
      const finalRooms = Array.from(uniqueRoomsMap.values()).filter(room => {
        if (room.type === 'public' && !room.is_member && room.creator_id !== session.user.id) {
          return true; // Keep public rooms user is not involved with
        }
        return room.is_member || room.creator_id === session.user.id; // Keep all rooms user is involved with
      });

      setRooms(finalRooms);

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