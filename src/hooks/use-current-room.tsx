"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRooms } from "./use-rooms";

const LOCAL_STORAGE_CURRENT_ROOM_ID_KEY = 'current_room_id';
const LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY = 'current_room_name';

export function useCurrentRoom() {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading } = useRooms();
  
  const [currentRoomId, setCurrentRoomIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_ID_KEY);
    }
    return null;
  });

  const [currentRoomName, setCurrentRoomNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY) || "My Room";
    }
    return "My Room";
  });

  const [isCurrentRoomWritable, setIsCurrentRoomWritable] = useState(true);

  const setCurrentRoom = useCallback((id: string | null, name: string) => {
    setCurrentRoomIdState(prevId => {
      if (prevId !== id) {
        return id;
      }
      return prevId;
    });
    setCurrentRoomNameState(prevName => {
      if (prevName !== name) {
        return name;
      }
      return prevName;
    });
    toast.info(`Switched to room: ${name}`);
  }, []);

  // Effect to synchronize current room with session and available rooms
  useEffect(() => {
    if (authLoading || roomsLoading) {
      return;
    }

    if (!session) {
      // User is a guest
      if (currentRoomId !== null || currentRoomName !== "My Room") {
        setCurrentRoomIdState(null);
        setCurrentRoomNameState("My Room");
      }
      setIsCurrentRoomWritable(true); // Guest's "My Room" is always writable
      return;
    }

    // User is logged in
    let targetRoomId: string | null = null;
    let targetRoomName: string = "My Room";

    // 1. Try to use personal_room_id from profile
    if (profile?.personal_room_id) {
      const personalRoom = rooms.find(room => room.id === profile.personal_room_id);
      if (personalRoom) {
        targetRoomId = personalRoom.id;
        targetRoomName = personalRoom.name;
      } else {
        console.warn(`Personal room (ID: ${profile.personal_room_id}) not found in fetched rooms.`);
      }
    }

    // 2. Fallback: If no personal_room_id or room not found, try to find the first room created by the user
    if (!targetRoomId) {
      const firstCreatedRoom = rooms.find(room => room.creator_id === session.user.id);
      if (firstCreatedRoom) {
        targetRoomId = firstCreatedRoom.id;
        targetRoomName = firstCreatedRoom.name;
      }
    }

    // 3. If a target room was found, update state if different
    if (targetRoomId !== currentRoomId || targetRoomName !== currentRoomName) {
      setCurrentRoomIdState(targetRoomId);
      setCurrentRoomNameState(targetRoomName);
      if (targetRoomId) {
        toast.info(`Switched to room: ${targetRoomName}`);
      } else {
        toast.info("No personal room found. Defaulting to 'My Room'.");
      }
    }
  }, [authLoading, roomsLoading, session, profile, rooms, currentRoomId, currentRoomName]);

  // Effect to persist current room ID to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentRoomId) {
        localStorage.setItem(LOCAL_STORAGE_CURRENT_ROOM_ID_KEY, currentRoomId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_CURRENT_ROOM_ID_KEY);
      }
    }
  }, [currentRoomId]);

  // Effect to persist current room name to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY, currentRoomName);
    }
  }, [currentRoomName]);

  // Effect to determine writability of the current room
  useEffect(() => {
    if (authLoading || roomsLoading) {
      return;
    }

    if (!currentRoomId) {
      setIsCurrentRoomWritable(true); // "My Room" (guest mode or no room selected) is always writable
      return;
    }

    const room = rooms.find(r => r.id === currentRoomId);

    if (!room) {
      setIsCurrentRoomWritable(false); // Room not found in the fetched list, assume not writable
      return;
    }

    if (!session?.user?.id) {
      setIsCurrentRoomWritable(false); // Not logged in, cannot write to any persistent room
      return;
    }

    // Only the creator has write access
    if (session.user.id === room.creator_id) {
      setIsCurrentRoomWritable(true);
      return;
    }
    
    setIsCurrentRoomWritable(false); // Default to false if no conditions met
  }, [currentRoomId, session, rooms, authLoading, roomsLoading]);


  return {
    currentRoomId,
    currentRoomName,
    setCurrentRoom,
    isCurrentRoomWritable,
  };
}