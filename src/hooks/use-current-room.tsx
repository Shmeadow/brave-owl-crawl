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
      return localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY) || "Dashboard";
    }
    return "Dashboard";
  });

  const [isCurrentRoomWritable, setIsCurrentRoomWritable] = useState(true);

  const setCurrentRoom = useCallback((id: string | null, name: string) => {
    console.log('useCurrentRoom: setCurrentRoom called:', { id, name });
    setCurrentRoomIdState(id);
    setCurrentRoomNameState(name);
    if (id) {
      toast.info(`Switched to room: ${name}`);
    } else {
      toast.info("Switched to your Dashboard.");
    }
  }, []);

  // New effect to listen for room join events
  useEffect(() => {
    const handleRoomJoined = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log('AppWrapper: roomJoined event received:', event.detail);
        const { roomId, roomName } = event.detail;
        if (roomId && roomName) {
          setCurrentRoom(roomId, roomName);
        }
      }
    };

    window.addEventListener('roomJoined', handleRoomJoined);

    return () => {
      window.removeEventListener('roomJoined', handleRoomJoined);
    };
  }, [setCurrentRoom]);

  // Effect to synchronize current room with session and available rooms
  useEffect(() => {
    if (authLoading || roomsLoading) {
      return;
    }

    const currentRoomFromState = rooms.find(room => room.id === currentRoomId);
    let newTargetRoomId: string | null = null;
    let newTargetRoomName: string = "Dashboard";

    // Scenario 1: User is logged in
    if (session) {
      // Check if the current room is valid and accessible for the logged-in user
      if (currentRoomFromState && (currentRoomFromState.is_member || currentRoomFromState.creator_id === session.user.id)) {
        // Current room is valid and accessible, keep it.
        newTargetRoomId = currentRoomFromState.id;
        newTargetRoomName = currentRoomFromState.name;
      } else {
        // Current room is invalid or inaccessible, find a new default
        if (profile?.personal_room_id) {
          const personalRoom = rooms.find(room => room.id === profile.personal_room_id);
          if (personalRoom) {
            newTargetRoomId = personalRoom.id;
            newTargetRoomName = personalRoom.name;
          }
        }
        // If no personal room or it's not found, default to dashboard (null)
        if (!newTargetRoomId) {
          newTargetRoomId = null;
          newTargetRoomName = "Dashboard";
        }
      }
    }
    // Scenario 2: User is a guest
    else {
      // Check if the current room is a valid public room for a guest
      if (currentRoomFromState && currentRoomFromState.type === 'public') {
        // Current room is valid public room, keep it.
        newTargetRoomId = currentRoomFromState.id;
        newTargetRoomName = currentRoomFromState.name;
      } else {
        // Current room is invalid or not public, default to dashboard (null)
        newTargetRoomId = null;
        newTargetRoomName = "Dashboard";
      }
    }

    console.log('useCurrentRoom: Re-evaluating active room. Current:', { currentRoomId, currentRoomName }, 'New Target:', { newTargetRoomId, newTargetRoomName });

    // Only update if the new target is different from the current state
    if (newTargetRoomId !== currentRoomId || newTargetRoomName !== currentRoomName) {
      setCurrentRoomIdState(newTargetRoomId);
      setCurrentRoomNameState(newTargetRoomName);
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
      setIsCurrentRoomWritable(true); // "Dashboard" (guest mode or no room selected) is always writable
      console.log('useCurrentRoom: isCurrentRoomWritable re-evaluated: true for Dashboard');
      return;
    }

    const room = rooms.find(r => r.id === currentRoomId);

    if (!room) {
      setIsCurrentRoomWritable(false); // Room not found in the fetched list, assume not writable
      console.log('useCurrentRoom: isCurrentRoomWritable re-evaluated: false (room not found)');
      return;
    }

    if (!session?.user?.id) {
      setIsCurrentRoomWritable(false); // Not logged in, cannot write to any persistent room
      console.log('useCurrentRoom: isCurrentRoomWritable re-evaluated: false (not logged in)');
      return;
    }

    // Only the creator has write access
    if (session.user.id === room.creator_id) {
      setIsCurrentRoomWritable(true);
      console.log('useCurrentRoom: isCurrentRoomWritable re-evaluated: true (user is creator)');
      return;
    }
    
    setIsCurrentRoomWritable(false); // Default to false if no conditions met
    console.log('useCurrentRoom: isCurrentRoomWritable re-evaluated: false (default)');
  }, [currentRoomId, session, rooms, authLoading, roomsLoading]);


  return {
    currentRoomId,
    currentRoomName,
    setCurrentRoom,
    isCurrentRoomWritable,
  };
}