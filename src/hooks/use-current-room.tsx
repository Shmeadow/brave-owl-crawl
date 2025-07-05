"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRooms } from "./use-rooms"; // Import useRooms

const LOCAL_STORAGE_CURRENT_ROOM_ID_KEY = 'current_room_id';
const LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY = 'current_room_name';

export function useCurrentRoom() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading } = useRooms(); // Get rooms and their loading state
  
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
    toast.info(`Switched to room: ${name}`);
  }, []);

  // Effect to synchronize current room with session and available rooms
  useEffect(() => {
    if (authLoading || roomsLoading) {
      // Still loading auth or rooms, defer logic
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
    const storedRoomId = currentRoomId;
    const foundRoom = rooms.find(room => room.id === storedRoomId);

    if (foundRoom && (foundRoom.is_member || foundRoom.creator_id === session.user.id)) {
      // The stored room is valid and accessible, keep it.
      // Ensure name is up-to-date in case it changed in DB
      if (foundRoom.name !== currentRoomName) {
        setCurrentRoomNameState(foundRoom.name);
      }
    } else {
      // Stored room is invalid, inaccessible, or no room was stored.
      // Try to find the user's personal room (the first room they created).
      const personalRoom = rooms.find(room => room.creator_id === session.user.id);

      if (personalRoom) {
        setCurrentRoomIdState(personalRoom.id);
        setCurrentRoomNameState(personalRoom.name);
        toast.info(`Switched to your personal room: ${personalRoom.name}`);
      } else {
        // Fallback: If no personal room found (shouldn't happen if trigger works),
        // or if rooms array is empty for some reason, default to "My Room" (guest-like state).
        setCurrentRoomIdState(null);
        setCurrentRoomNameState("My Room");
        toast.info("Could not find your personal room. Defaulting to 'My Room'.");
      }
    }
  }, [authLoading, roomsLoading, session, rooms, currentRoomId, currentRoomName, setCurrentRoom]);

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
      // Still loading auth or rooms, defer logic
      return;
    }

    if (!currentRoomId) {
      setIsCurrentRoomWritable(true); // "My Room" (guest mode or no room selected) is always writable
      return;
    }

    const room = rooms.find(r => r.id === currentRoomId);

    if (!room) {
      // Room not found in the fetched list, assume not writable
      setIsCurrentRoomWritable(false);
      return;
    }

    if (!session?.user?.id) {
      // Not logged in, cannot write to any persistent room
      setIsCurrentRoomWritable(false);
      return;
    }

    // In the new system, only the creator has write access
    if (session.user.id === room.creator_id) {
      setIsCurrentRoomWritable(true);
      return;
    }
    
    // Default to false if no conditions met
    setIsCurrentRoomWritable(false);
  }, [currentRoomId, session, rooms, authLoading, roomsLoading]);


  return {
    currentRoomId,
    currentRoomName,
    setCurrentRoom,
    isCurrentRoomWritable,
  };
}