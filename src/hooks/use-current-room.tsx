"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { getRandomBackground } from "@/lib/backgrounds"; // Import getRandomBackground

const LOCAL_STORAGE_CURRENT_ROOM_ID_KEY = 'current_room_id';
const LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY = 'current_room_name';
const LOCAL_STORAGE_CURRENT_ROOM_BG_URL_KEY = 'current_room_bg_url';
const LOCAL_STORAGE_CURRENT_ROOM_BG_VIDEO_KEY = 'current_room_bg_video';

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
  const [currentRoomCreatorId, setCurrentRoomCreatorId] = useState<string | null>(null);
  const [currentRoomBackgroundUrl, setCurrentRoomBackgroundUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_BG_URL_KEY) || getRandomBackground().url;
    }
    return getRandomBackground().url;
  });
  const [isCurrentRoomVideoBackground, setIsCurrentRoomVideoBackground] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_BG_VIDEO_KEY);
      return saved === 'true';
    }
    return getRandomBackground().isVideo;
  });

  const setCurrentRoom = useCallback(async (id: string | null, name: string) => {
    setCurrentRoomIdState(id);
    setCurrentRoomNameState(name);
    toast.info(`Switched to room: ${name}`);

    if (id && supabase) {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('creator_id, background_url, is_video_background')
        .eq('id', id)
        .single();

      if (roomError || !roomData) {
        console.error("Error fetching room data for current room:", roomError);
        setCurrentRoomCreatorId(null);
        const defaultBg = getRandomBackground();
        setCurrentRoomBackgroundUrl(defaultBg.url);
        setIsCurrentRoomVideoBackground(defaultBg.isVideo);
      } else {
        setCurrentRoomCreatorId(roomData.creator_id);
        setCurrentRoomBackgroundUrl(roomData.background_url || getRandomBackground().url);
        setIsCurrentRoomVideoBackground(roomData.is_video_background ?? getRandomBackground().isVideo);
      }
    } else {
      setCurrentRoomCreatorId(null); // No specific room or guest room
      const defaultBg = getRandomBackground();
      setCurrentRoomBackgroundUrl(defaultBg.url);
      setIsCurrentRoomVideoBackground(defaultBg.isVideo);
    }
  }, [supabase]);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const initializeRoom = async () => {
      // If the user is logged in but they are currently in the "guest" room (no ID),
      // find their personal room and switch to it.
      if (session && !currentRoomId && supabase) {
        const { data: personalRoom, error } = await supabase
          .from('rooms')
          .select('id, name, creator_id, background_url, is_video_background')
          .eq('creator_id', session.user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (personalRoom) {
          setCurrentRoomIdState(personalRoom.id);
          setCurrentRoomNameState(personalRoom.name);
          setCurrentRoomCreatorId(personalRoom.creator_id);
          setCurrentRoomBackgroundUrl(personalRoom.background_url || getRandomBackground().url);
          setIsCurrentRoomVideoBackground(personalRoom.is_video_background ?? getRandomBackground().isVideo);
        } else if (error && error.code !== 'PGRST116') {
          console.error("Error fetching personal room:", error);
          toast.error("Could not find your personal room.");
          // Fallback to default guest room if personal room not found
          setCurrentRoomIdState(null);
          setCurrentRoomNameState("My Room");
          setCurrentRoomCreatorId(null);
          const defaultBg = getRandomBackground();
          setCurrentRoomBackgroundUrl(defaultBg.url);
          setIsCurrentRoomVideoBackground(defaultBg.isVideo);
        } else {
          // No personal room found, but logged in. This shouldn't happen if handle_new_user works.
          // For now, default to guest room.
          setCurrentRoomIdState(null);
          setCurrentRoomNameState("My Room");
          setCurrentRoomCreatorId(null);
          const defaultBg = getRandomBackground();
          setCurrentRoomBackgroundUrl(defaultBg.url);
          setIsCurrentRoomVideoBackground(defaultBg.isVideo);
        }
      } else if (!session && !currentRoomId) {
        // This is a new guest session. Set their default room.
        setCurrentRoomIdState(null);
        setCurrentRoomNameState("My Room");
        setCurrentRoomCreatorId(null);
        const defaultBg = getRandomBackground();
        setCurrentRoomBackgroundUrl(defaultBg.url);
        setIsCurrentRoomVideoBackground(defaultBg.isVideo);
      } else if (currentRoomId && supabase) {
        // If a room ID is already set (from local storage), fetch its details
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('name, creator_id, background_url, is_video_background')
          .eq('id', currentRoomId)
          .single();

        if (roomError || !roomData) {
          console.error("Error fetching details for saved current room:", roomError);
          toast.error("Could not load details for your last room. Switching to My Room.");
          setCurrentRoomIdState(null);
          setCurrentRoomNameState("My Room");
          setCurrentRoomCreatorId(null);
          const defaultBg = getRandomBackground();
          setCurrentRoomBackgroundUrl(defaultBg.url);
          setIsCurrentRoomVideoBackground(defaultBg.isVideo);
        } else {
          setCurrentRoomNameState(roomData.name);
          setCurrentRoomCreatorId(roomData.creator_id);
          setCurrentRoomBackgroundUrl(roomData.background_url || getRandomBackground().url);
          setIsCurrentRoomVideoBackground(roomData.is_video_background ?? getRandomBackground().isVideo);
        }
      }
    };

    initializeRoom();
  }, [authLoading, session, currentRoomId, supabase]);

  // Persist current room ID and name to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentRoomId) {
        localStorage.setItem(LOCAL_STORAGE_CURRENT_ROOM_ID_KEY, currentRoomId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_CURRENT_ROOM_ID_KEY);
      }
      localStorage.setItem(LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY, currentRoomName);
      localStorage.setItem(LOCAL_STORAGE_CURRENT_ROOM_BG_URL_KEY, currentRoomBackgroundUrl);
      localStorage.setItem(LOCAL_STORAGE_CURRENT_ROOM_BG_VIDEO_KEY, String(isCurrentRoomVideoBackground));
    }
  }, [currentRoomId, currentRoomName, currentRoomBackgroundUrl, isCurrentRoomVideoBackground]);

  // Check write access for the current room
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

      // Fetch room details including creator_id and allow_guest_write
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('creator_id, allow_guest_write')
        .eq('id', currentRoomId)
        .single();

      if (roomError || !roomData) {
        console.error("Error fetching room data for write access check:", roomError);
        setIsCurrentRoomWritable(false);
        return;
      }

      // Check if user is the creator
      if (session.user.id === roomData.creator_id) {
        setIsCurrentRoomWritable(true);
        return;
      }

      // If not creator, check if guest write is allowed AND user is a member
      if (roomData.allow_guest_write) {
        const { data: membership, error: membershipError } = await supabase
          .from('room_members')
          .select('id')
          .eq('room_id', currentRoomId)
          .eq('user_id', session.user.id)
          .single();

        if (!membershipError && membership) {
          setIsCurrentRoomWritable(true); // Guest write allowed and user is a member
          return;
        }
      }
      
      setIsCurrentRoomWritable(false); // Default to false if no conditions met
    };

    checkWriteAccess();
  }, [currentRoomId, session, supabase, authLoading]);


  return {
    currentRoomId,
    currentRoomName,
    setCurrentRoom,
    isCurrentRoomWritable,
    currentRoomCreatorId,
    currentRoomBackgroundUrl,
    isCurrentRoomVideoBackground,
  };
}