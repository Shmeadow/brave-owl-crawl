"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { getRandomBackground, DEFAULT_BACKGROUND_FOR_NEW_USERS } from "@/lib/backgrounds"; // Import DEFAULT_BACKGROUND_FOR_NEW_USERS

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
    console.log(`[useCurrentRoom] setCurrentRoom called: ID=${id}, Name=${name}`);
    setCurrentRoomIdState(id);
    setCurrentRoomNameState(name);
    toast.info(`Switched to room: ${name}`);

    if (id && supabase) {
      console.log(`[useCurrentRoom] Fetching room details for ID: ${id}`);
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('creator_id, background_url, is_video_background')
        .eq('id', id)
        .single();

      if (roomError || !roomData) {
        console.error("[useCurrentRoom] Error fetching room data for current room:", roomError);
        setCurrentRoomCreatorId(null);
        const defaultBg = DEFAULT_BACKGROUND_FOR_NEW_USERS;
        setCurrentRoomBackgroundUrl(defaultBg.url);
        setIsCurrentRoomVideoBackground(defaultBg.isVideo);
        console.log(`[useCurrentRoom] Set background to default due to fetch error. URL: ${defaultBg.url}`);
      } else {
        setCurrentRoomCreatorId(roomData.creator_id);
        setCurrentRoomBackgroundUrl(roomData.background_url || DEFAULT_BACKGROUND_FOR_NEW_USERS.url);
        setIsCurrentRoomVideoBackground(roomData.is_video_background ?? DEFAULT_BACKGROUND_FOR_NEW_USERS.isVideo);
        console.log(`[useCurrentRoom] Fetched room details. Creator: ${roomData.creator_id}, BG URL: ${roomData.background_url}, Is Video: ${roomData.is_video_background}`);
      }
    } else {
      console.log("[useCurrentRoom] No specific room ID provided or Supabase not available. Setting to personal space defaults.");
      setCurrentRoomCreatorId(null);
      const defaultBg = DEFAULT_BACKGROUND_FOR_NEW_USERS;
      setCurrentRoomBackgroundUrl(defaultBg.url);
      setIsCurrentRoomVideoBackground(defaultBg.isVideo);
      console.log(`[useCurrentRoom] Set background to default for personal space. URL: ${defaultBg.url}`);
    }
  }, [supabase]);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) {
      console.log("[useCurrentRoom] Auth loading, skipping initial room setup.");
      return;
    }

    const initializeRoom = async () => {
      console.log("[useCurrentRoom] Initializing room based on session and local storage...");
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
        console.log(`[useCurrentRoom] Loaded from local storage: ID=${initialRoomId}, Name=${initialRoomName}, BG URL: ${initialBgUrl}, Is Video: ${initialIsVideoBg}`);
      }

      if (session && supabase) {
        console.log("[useCurrentRoom] User is logged in. Checking for personal room or saved room details.");
        if (!initialRoomId) { // Only fetch personal room if no room was saved locally
          console.log("[useCurrentRoom] No room saved locally, fetching personal room from Supabase.");
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
            initialBgUrl = personalRoom.background_url || DEFAULT_BACKGROUND_FOR_NEW_USERS.url; // Use default if Supabase has null
            initialIsVideoBg = personalRoom.is_video_background ?? DEFAULT_BACKGROUND_FOR_NEW_USERS.isVideo;
            console.log(`[useCurrentRoom] Found personal room: ID=${initialRoomId}, Name=${initialRoomName}`);
          } else if (error && error.code !== 'PGRST116') {
            console.error("[useCurrentRoom] Error fetching personal room:", error);
            toast.error("Could not find your personal room.");
            // Fallback to default guest room if personal room not found
            initialRoomId = null;
            initialRoomName = "My Room";
            initialRoomCreatorId = null;
            const defaultBg = DEFAULT_BACKGROUND_FOR_NEW_USERS;
            initialBgUrl = defaultBg.url;
            initialIsVideoBg = defaultBg.isVideo;
            console.log("[useCurrentRoom] Fallback to default guest room due to personal room fetch error.");
          }
        } else { // A room ID was saved locally, fetch its details from Supabase
          console.log(`[useCurrentRoom] Room ID ${initialRoomId} saved locally. Fetching its details.`);
          const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select('name, creator_id, background_url, is_video_background')
            .eq('id', initialRoomId)
            .single();

          if (roomError || !roomData) {
            console.error("[useCurrentRoom] Error fetching details for saved current room:", roomError);
            toast.error("Could not load details for your last room. Switching to My Room.");
            initialRoomId = null;
            initialRoomName = "My Room";
            initialRoomCreatorId = null;
            const defaultBg = DEFAULT_BACKGROUND_FOR_NEW_USERS;
            initialBgUrl = defaultBg.url;
            initialIsVideoBg = defaultBg.isVideo;
            console.log("[useCurrentRoom] Fallback to default guest room due to saved room fetch error.");
          } else {
            initialRoomName = roomData.name;
            initialRoomCreatorId = roomData.creator_id;
            initialBgUrl = roomData.background_url || DEFAULT_BACKGROUND_FOR_NEW_USERS.url;
            initialIsVideoBg = roomData.is_video_background ?? DEFAULT_BACKGROUND_FOR_NEW_USERS.isVideo;
            console.log(`[useCurrentRoom] Loaded details for saved room: Name=${initialRoomName}, Creator: ${initialRoomCreatorId}`);
          }
        }
      } else {
        console.log("[useCurrentRoom] User is not logged in (guest mode).");
        if (!initialRoomId) { // If no local room saved, set a default
          const defaultBg = DEFAULT_BACKGROUND_FOR_NEW_USERS;
          initialBgUrl = defaultBg.url;
          initialIsVideoBg = defaultBg.isVideo;
          console.log("[useCurrentRoom] No local room saved for guest, setting default background.");
        }
        initialRoomId = null; // Guests always operate in a "null" room context for data storage
        initialRoomName = "My Room";
        initialRoomCreatorId = null;
      }

      // Set states after all determination logic
      setCurrentRoomIdState(initialRoomId);
      setCurrentRoomNameState(initialRoomName);
      setCurrentRoomCreatorId(initialRoomCreatorId);
      setCurrentRoomBackgroundUrl(initialBgUrl || DEFAULT_BACKGROUND_FOR_NEW_USERS.url); // Fallback to default if still empty
      setIsCurrentRoomVideoBackground(initialIsVideoBg ?? DEFAULT_BACKGROUND_FOR_NEW_USERS.isVideo); // Fallback to default if still null
      console.log(`[useCurrentRoom] Initial room set: ID=${initialRoomId}, Name=${initialRoomName}, Background URL=${initialBgUrl}, Is Video=${initialIsVideoBg}`);
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
      console.log(`[useCurrentRoom] Persisted to local storage: ID=${currentRoomId}, Name=${currentRoomName}, BG URL=${currentRoomBackgroundUrl}, Is Video=${isCurrentRoomVideoBackground}`);
    }
  }, [currentRoomId, currentRoomName, currentRoomBackgroundUrl, isCurrentRoomVideoBackground]);

  // Check write access for the current room
  useEffect(() => {
    if (authLoading) {
      console.log("[useCurrentRoom] Auth loading, skipping write access check.");
      return;
    }

    const checkWriteAccess = async () => {
      console.log(`[useCurrentRoom] Checking write access for room ID: ${currentRoomId || 'personal space'}`);
      if (!currentRoomId) {
        setIsCurrentRoomWritable(true); // "My Room" is always writable for the user
        console.log("[useCurrentRoom] Personal space, always writable.");
        return;
      }

      if (!session?.user?.id || !supabase) {
        setIsCurrentRoomWritable(false); // Not logged in, cannot write to any room
        console.log("[useCurrentRoom] Not logged in, room not writable.");
        return;
      }

      // Fetch room details including creator_id and allow_guest_write
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('creator_id, allow_guest_write')
        .eq('id', currentRoomId)
        .single();

      if (roomError || !roomData) {
        console.error("[useCurrentRoom] Error fetching room data for write access check:", roomError);
        setIsCurrentRoomWritable(false);
        return;
      }

      // Check if user is the creator
      if (session.user.id === roomData.creator_id) {
        setIsCurrentRoomWritable(true);
        console.log("[useCurrentRoom] User is room creator, writable.");
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
          console.log("[useCurrentRoom] Guest write allowed and user is member, writable.");
          return;
        }
      }
      
      setIsCurrentRoomWritable(false); // Default to false if no conditions met
      console.log("[useCurrentRoom] Room not writable for current user.");
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