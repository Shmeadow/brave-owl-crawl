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
    setCurrentRoomIdState(id);
    setCurrentRoomNameState(name);
    if (id) {
      toast.info(`Switched to room: ${name}`);
    } else {
      toast.info("Switched to your personal space.");
    }
  }, []);

  // Effect to synchronize current room with session and available rooms
  useEffect(() => {
    if (authLoading || roomsLoading) {
      return;
    }

    let shouldUpdateCurrentRoom = false;
    let newTargetRoomId: string | null = null;
    let newTargetRoomName: string = "My Room";

    // Check if the currentRoomId is still valid and accessible
    const existingCurrentRoom = rooms.find(room => room.id === currentRoomId);

    if (existingCurrentRoom && session) {
      // If logged in, check if the existing current room is still accessible
      if (existingCurrentRoom.is_member || existingCurrentRoom.creator_id === session.user.id) {
        // Current room is valid and accessible, keep it.
        newTargetRoomId = existingCurrentRoom.id;
        newTargetRoomName = existingCurrentRoom.name;
      } else {
        // Current room is not accessible for the logged-in user, need to find a new one.
        shouldUpdateCurrentRoom = true;
      }
    } else if (existingCurrentRoom && !session && existingCurrentRoom.type === 'public') {
      // If guest, and current room is a public room, keep it.
      newTargetRoomId = existingCurrentRoom.id;
      newTargetRoomName = existingCurrentRoom.name;
    } else {
      // No current room, or it's invalid/inaccessible (e.g., private room for guest, or deleted room)
      shouldUpdateCurrentRoom = true;
    }

    if (shouldUpdateCurrentRoom) {
      if (session) {
        // Logged in user: prioritize personal room, then first created room
        if (profile?.personal_room_id) {
          const personalRoom = rooms.find(room => room.id === profile.personal_room_id);
          if (personalRoom) {
            newTargetRoomId = personalRoom.id;
            newTargetRoomName = personalRoom.name;
          }
        }
        if (!newTargetRoomId) {
          const firstCreatedRoom = rooms.find(room => room.creator_id === session.user.id);
          if (firstCreatedRoom) {
            newTargetRoomId = firstCreatedRoom.id;
            newTargetRoomName = firstCreatedRoom.name;
          }
        }
      } else {
        // Guest user: default to null (My Room)
        newTargetRoomId = null;
        newTargetRoomName = "My Room";
      }

      // Only update if the new target is different from the current state
      if (newTargetRoomId !== currentRoomId || newTargetRoomName !== currentRoomName) {
        setCurrentRoomIdState(newTargetRoomId);
        setCurrentRoomNameState(newTargetRoomName);
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