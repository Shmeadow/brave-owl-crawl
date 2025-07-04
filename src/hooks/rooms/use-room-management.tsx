"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";
import { getRandomBackground, DEFAULT_BACKGROUND_FOR_NEW_USERS } from "@/lib/backgrounds";
import { generateRandomCode } from "@/lib/room-utils"; // New import

interface UseRoomManagementProps {
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  fetchRooms: () => Promise<void>;
}

export function useRoomManagement({ setRooms, fetchRooms }: UseRoomManagementProps) {
  const { supabase, session } = useSupabase();

  const handleCreateRoom = useCallback(async (name: string, isPublic: boolean = false) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to create a room.");
      return;
    }

    const defaultBg = DEFAULT_BACKGROUND_FOR_NEW_USERS;

    // 1. Create the room
    const { data: newRoom, error: roomError } = await supabase
      .from('rooms')
      .insert({
        creator_id: session.user.id,
        name: name,
        is_public: isPublic,
        allow_guest_write: false,
        password_hash: null,
        background_url: defaultBg.url,
        is_video_background: defaultBg.isVideo,
      })
      .select('*, creator:profiles(first_name, last_name)')
      .single();

    if (roomError) {
      toast.error("Error creating room: " + roomError.message);
      console.error("Error creating room:", roomError);
      return;
    }

    // 2. Generate and insert a unique invite code for the new room
    let inviteCode = '';
    let isCodeUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (!isCodeUnique && attempts < MAX_ATTEMPTS) {
      const potentialCode = generateRandomCode();
      const { data: existingCode, error: codeCheckError } = await supabase
        .from('room_invites')
        .select('id')
        .eq('code', potentialCode)
        .single();

      if (codeCheckError && codeCheckError.code === 'PGRST116') { // PGRST116 means no rows found
        inviteCode = potentialCode;
        isCodeUnique = true;
      } else if (codeCheckError) {
        console.error("Error checking code uniqueness during room creation:", codeCheckError);
        // Continue attempts or break if critical error
      }
      attempts++;
    }

    if (!isCodeUnique) {
      toast.error("Failed to generate a unique invite code for the room.");
      // Proceed without invite code, but log the issue.
    } else {
      const { error: inviteError } = await supabase
        .from('room_invites')
        .insert({
          room_id: newRoom.id,
          code: inviteCode,
          creator_id: session.user.id,
          expires_at: null, // No expiration for now
        });

      if (inviteError) {
        toast.error("Error creating invite code for room: " + inviteError.message);
        console.error("Error creating invite code for room:", inviteError);
      }
    }

    setRooms((prevRooms) => [...prevRooms, { ...newRoom, is_member: true } as RoomData]);
    toast.success(`Room "${newRoom.name}" created successfully! It is currently ${newRoom.is_public ? 'public' : 'private'}.`);
    if (inviteCode) {
      toast.info(`Invite Code: ${inviteCode}`); // Show the code immediately
    }
  }, [session, supabase, setRooms]);

  const handleToggleRoomPublicStatus = useCallback(async (roomId: string, currentStatus: boolean) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to change room status.");
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ is_public: !currentStatus })
      .eq('id', roomId)
      .eq('creator_id', session.user.id)
      .select('*, creator:profiles(first_name, last_name)')
      .single();

    if (error) {
      toast.error("Error updating room status: " + error.message);
      console.error("Error updating room status:", error);
    } else if (data) {
      setRooms(prevRooms => prevRooms.map(room => room.id === roomId ? data as RoomData : room));
      toast.success(`Room "${data.name}" is now ${data.is_public ? 'public' : 'private'}.`);
    } else {
      toast.error("Failed to update room status. You might not be the owner.");
    }
  }, [session, supabase, setRooms]);

  const handleToggleGuestWriteAccess = useCallback(async (roomId: string, currentStatus: boolean) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to change room settings.");
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ allow_guest_write: !currentStatus })
      .eq('id', roomId)
      .eq('creator_id', session.user.id)
      .select('*, creator:profiles(first_name, last_name)')
      .single();

    if (error) {
      toast.error("Error updating guest write access: " + error.message);
      console.error("Error updating guest write access:", error);
    } else if (data) {
      setRooms(prevRooms => prevRooms.map(room => room.id === roomId ? data as RoomData : room));
      toast.success(`Guest write access for "${data.name}" is now ${data.allow_guest_write ? 'enabled' : 'disabled'}.`);
    } else {
      toast.error("Failed to update guest write access. You might not be the owner.");
    }
  }, [session, supabase, setRooms]);

  const handleSetRoomPassword = useCallback(async (roomId: string, password?: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to set a room password.");
      return;
    }

    try {
      const response = await fetch('https://mrdupsekghsnbooyrdmj.supabase.co/functions/v1/set-room-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roomId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Error setting password: " + (data.error || "Unknown error"));
        console.error("Error setting password:", data.error);
      } else {
        toast.success(password ? "Room password set successfully!" : "Room password removed.");
        fetchRooms(); // Re-fetch to get the actual state
      }
    } catch (error) {
      toast.error("Failed to set password due to network error.");
      console.error("Network error setting password:", error);
    }
  }, [session, supabase, fetchRooms]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to delete a room.");
      return;
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
      .eq('creator_id', session.user.id); // Ensure only creator can delete

    if (error) {
      toast.error("Error deleting room: " + error.message);
      console.error("Error deleting room:", error);
    } else {
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      toast.success("Room deleted successfully.");
    }
  }, [session, supabase, setRooms]);

  return {
    handleCreateRoom,
    handleToggleRoomPublicStatus,
    handleToggleGuestWriteAccess,
    handleSetRoomPassword,
    handleDeleteRoom,
  };
}