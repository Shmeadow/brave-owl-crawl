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
  // Initialize with null/empty defaults to avoid hydration mismatch
  const [currentRoomId, setCurrentRoomIdState] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomNameState] = useState<string>("My Room");
  const [isCurrentRoomWritable, setIsCurrentRoomWritable] = useState(true);
  const [currentRoomCreatorId, setCurrentRoomCreatorId] = useState<string | null>(null);
  const [currentRoomBackgroundUrl, setCurrentRoomBackgroundUrl] = useState<string>(""); // Initialize empty
  const [isCurrentRoomVideoBackground, setIsCurrentRoomVideoBackground] = useState<boolean>(false); // Initialize false

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
      let initialRoomId: string | null = null;
      let initialRoomName: string = "My Room";
      let initialRoomCreatorId: string | null = null;
      let initialBgUrl: string = "";
      let initialIsVideoBg: boolean = false;

      // Try to load from local storage first (client-side only)
      if (typeof window !== 'undefined') {
        initialRoomId = localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_ID_KEY);
        initialRoomName = localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_NAME_KEY) || "My Room";
        initialBgUrl = localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_BG_URL_KEY) || "";
        initialIsVideoBg = localStorage.getItem(LOCAL_STORAGE_CURRENT_ROOM_BG_VIDEO_KEY) === 'true';
      }

      if (session && supabase) {
        // If logged in, prioritize fetching personal room from Supabase
        if (!initialRoomId) { // Only fetch personal room if no room was saved locally
          const { data: personalRoom, error } = await supabase
            .from('rooms')
            .select('id, name, creator_id, background_url, is_video_background')
            .eq('creator_id', session.user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (personalRoom) {
            initialRoomId = personalRoom.id;
            initialRoomName = personalRoom.name;
            initialRoomCreatorId = personalRoom.creator_id;
            initialBgUrl = personalRoom.background_url || getRandomBackground().url; // Use random if Supabase has null
            initialIsVideoBg = personalRoom.is_video_background ?? getRandomBackground().isVideo;
          } else if (error && error.code !== 'PGRST116') {
            console.error("Error fetching personal room:", error);
            toast.error("Could not find your personal room.");
            // Fallback to default guest room if personal room not found
            initialRoomId = null;
            initialRoomName = "My Room";
            initialRoomCreatorId = null;
            const defaultBg = getRandomBackground();
            initialBgUrl = defaultBg.url;
            initialIsVideoBg = defaultBg.isVideo;
          }
        } else { // A room ID was saved locally, fetch its details from Supabase
          const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select('name, creator_id, background_url, is_video_background')
            .eq('id', initialRoomId)
            .single();

          if (roomError || !roomData) {
            console.error("Error fetching details for saved current room:", roomError);
            toast.error("Could not load details for your last room. Switching to My Room.");
            initialRoomId = null;
            initialRoomName = "My Room";
            initialRoomCreatorId = null;
            const defaultBg = getRandomBackground();
            initialBgUrl = defaultBg.url;
            initialIsVideoBg = defaultBg.isVideo;
          } else {
            initialRoomName = roomData.name;
            initialRoomCreatorId = roomData.creator_id;
            initialBgUrl = roomData.background_url || getRandomBackground().url;
            initialIsVideoBg = roomData.is_video_background ?? getRandomBackground().isVideo;
          }
        }
      } else {
        // Not logged in (guest mode)
        if (!initialRoomId) { // If no local room saved, set a random default
          const defaultBg = getRandomBackground();
          initialBgUrl = defaultBg.url;
          initialIsVideoBg = defaultBg.isVideo;
        }
        initialRoomId = null; // Guests always operate in a "null" room context for data storage
        initialRoomName = "My Room";
        initialRoomCreatorId = null;
      }

      // Set states after all determination logic
      setCurrentRoomIdState(initialRoomId);
      setCurrentRoomNameState(initialRoomName);
      setCurrentRoomCreatorId(initialRoomCreatorId);
      setCurrentRoomBackgroundUrl(initialBgUrl || getRandomBackground().url); // Fallback to random if still empty
      setIsCurrentRoomVideoBackground(initialIsVideoBg ?? getRandomBackground().isVideo); // Fallback to random if still null
    };

    initializeRoom();
  }, [authLoading, session, supabase]); // Depend on authLoading, session, supabase

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