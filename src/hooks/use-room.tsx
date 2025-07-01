"use client";

import { useState, useEffect, useCallback } from "react";

const LOCAL_STORAGE_ROOM_NAME_KEY = 'current_room_name';

export function useRoom() {
  const [roomName, setRoomNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedRoomName = localStorage.getItem(LOCAL_STORAGE_ROOM_NAME_KEY);
      return savedRoomName || "My Room"; // Default room name
    }
    return "My Room";
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_ROOM_NAME_KEY, roomName);
    }
  }, [roomName]);

  const setRoomName = useCallback((name: string) => {
    setRoomNameState(name);
  }, []);

  return {
    roomName,
    setRoomName,
  };
}