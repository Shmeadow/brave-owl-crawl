"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";

const LOCAL_STORAGE_CURRENT_ROOM_ID_KEY = 'current_room_id';
const LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY = 'current_room_name';

export function useCurrentRoom() {
  const { supabase, session, loading: authLoading } = useSupabase();
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentRoomId) {
        localStorage.setItem(LOCAL_STORAGE_CURRENT_ROOM_ID_KEY, currentRoomId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_CURRENT_ROOM_ID_KEY);
      }
    }
  }, [currentRoomId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY, currentRoomName);
    }
  }, [currentRoomName]);

  useEffect(() => {
    if (authLoading) return;

    const checkWriteAccess = async () => {
      if (!currentRoomId) {
        setIsCurrentRoomWritable(true); // "My Room" is always writable for the user
        return;
      }

      if (!session?.user?.id || !supabase) {
        setIsCurrentRoomWritable(false); // Not logged in, cannot write to any room
        return;
      }

      const { data: roomData, error } = await supabase
        .from('rooms')
        .select('creator_id')
        .eq('id', currentRoomId)
        .single();

      if (error || !roomData) {
        console.error("Error fetching room data for write access check:", error);
        setIsCurrentRoomWritable(false);
        return;
      }

      setIsCurrentRoomWritable(session.user.id === roomData.creator_id);
    };

    checkWriteAccess();
  }, [currentRoomId, session, supabase, authLoading]);


  const setCurrentRoom = useCallback((id: string | null, name: string) => {
    setCurrentRoomIdState(id);
    setCurrentRoomNameState(name);
    toast.info(`Switched to room: ${name}`);
  }, []);

  return {
    currentRoomId,
    currentRoomName,
    setCurrentRoom,
    isCurrentRoomWritable,
  };
}