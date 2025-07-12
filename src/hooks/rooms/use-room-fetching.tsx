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
    try {
      const nowIso = new Date().toISOString();
      let allFetchedRooms: RoomData[] = [];
      const creatorIds = new Set<string>();

      if (session?.user?.id) {
        // Fetch rooms created by the user
        const { data: createdRooms, error: createdError } = await supabase
          .from('rooms')
          .select('id, creator_id, name, created_at, background_url, is_video_background, password_hash, type, closes_at, deleted_at, description')
          .eq('creator_id', session.user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (createdError) {
          toast.error("Error fetching your created rooms: " + createdError.message);
        } else if (createdRooms) {
          createdRooms.forEach(room => creatorIds.add(room.creator_id));
          allFetchedRooms.push(...createdRooms.map(room => ({ ...room, is_member: true })));
        }

        // Fetch rooms where the user is a member
        const { data: memberEntries, error: memberError } = await supabase
          .from('room_members')
          .select('rooms(*)')
          .eq('user_id', session.user.id);

        if (memberError) {
          toast.error("Error fetching rooms you joined: " + memberError.message);
        } else if (memberEntries) {
          const joinedRooms = memberEntries
            .map((entry: any) => ({ ...entry.rooms, is_member: true }))
            .filter((room: RoomData) => room.creator_id !== session.user.id && room.deleted_at === null && room.closes_at && room.closes_at > nowIso);
          joinedRooms.forEach(room => creatorIds.add(room.creator_id));
          allFetchedRooms.push(...joinedRooms);
        }
      }

      // Fetch all public rooms
      const { data: publicRooms, error: publicRoomsError } = await supabase
        .from('rooms')
        .select('id, creator_id, name, created_at, background_url, is_video_background, password_hash, type, closes_at, deleted_at, description')
        .eq('type', 'public')
        .is('deleted_at', null)
        .gt('closes_at', nowIso);

      if (publicRoomsError) {
        console.error("Error fetching public rooms:", publicRoomsError);
      } else if (publicRooms) {
        publicRooms.forEach(room => creatorIds.add(room.creator_id));
        allFetchedRooms.push(...publicRooms.map(room => ({ ...room, is_member: false })));
      }

      // Fetch all required profiles in one go
      let profilesMap = new Map();
      if (creatorIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', Array.from(creatorIds));
        
        if (profilesError) {
          toast.error("Error fetching user profiles for rooms.");
        } else if (profilesData) {
          profilesMap = new Map(profilesData.map(p => [p.id, p]));
        }
      }

      // Combine and deduplicate rooms, adding profile data
      const uniqueRoomsMap = new Map<string, RoomData>();
      for (const room of allFetchedRooms) {
        const creatorProfile = profilesMap.get(room.creator_id);
        const roomWithProfile = {
          ...room,
          profiles: creatorProfile ? [creatorProfile] : [],
        };

        const existing = uniqueRoomsMap.get(room.id);
        if (!existing || (room.is_member && !existing.is_member)) {
          uniqueRoomsMap.set(room.id, roomWithProfile);
        }
      }

      setRooms(Array.from(uniqueRoomsMap.values()));
    } catch (error: any) {
      console.error("A top-level error occurred while fetching rooms:", error);
      toast.error("An unexpected error occurred while fetching room data.");
    } finally {
      setLoading(false);
    }
  }, [supabase, session, authLoading]);

  useEffect(() => {
    fetchRooms();

    if (!supabase || !session?.user?.id) return;

    const roomsChannel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
        fetchRooms();
      })
      .subscribe();

    const roomMembersChannel = supabase
      .channel('public:room_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, (payload) => {
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