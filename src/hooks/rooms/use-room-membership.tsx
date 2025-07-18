"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";
import { useNotifications } from "@/hooks/use-notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import { invokeEdgeFunction } from "@/lib/supabase-edge-functions"; // Import the new utility

interface UseRoomMembershipProps {
  rooms: RoomData[];
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  fetchRooms: () => Promise<void>;
}

async function resolveRoomId(supabase: SupabaseClient, id: string): Promise<string | null> {
  // 1. Check if it's a direct room ID
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('id')
    .eq('id', id)
    .single();

  if (roomData) {
    return roomData.id;
  }
  if (roomError && roomError.code !== 'PGRST116') {
    console.error("Error checking for room ID:", roomError);
    return null;
  }

  // 2. If not a room ID, check if it's a user ID with a personal room
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('personal_room_id')
    .eq('id', id)
    .single();
  
  if (profileData && profileData.personal_room_id) {
    return profileData.personal_room_id;
  }
  if (profileError && profileError.code !== 'PGRST116') {
    console.error("Error checking for user ID:", profileError);
    return null;
  }

  return null;
}

export function useRoomMembership({ rooms, setRooms, fetchRooms }: UseRoomMembershipProps) {
  const { supabase, session } = useSupabase();
  const { addNotification } = useNotifications();

  const handleJoinRoomByPassword = useCallback(async (idInput: string, passwordAttempt: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to join a room.");
      return;
    }

    console.log('handleJoinRoomByPassword: Attempting to join room:', idInput);
    const resolvedRoomId = await resolveRoomId(supabase, idInput);
    console.log('handleJoinRoomByPassword: Resolved Room ID:', resolvedRoomId);

    if (!resolvedRoomId) {
      toast.error("Room or User not found.");
      return;
    }

    const room = rooms.find(r => r.id === resolvedRoomId);

    if (!room) {
      toast.error("Room not found or you don't have access.");
      return;
    }

    try {
      const response = await invokeEdgeFunction<{ message: string; roomName: string; status: 'already_joined' | 'joined' | 'pending_request' | 'request_sent' }>(
        'join-room',
        {
          method: 'POST',
          body: { roomId: resolvedRoomId, passwordAttempt },
          accessToken: session.access_token,
        }
      );

      console.log('handleJoinRoomByPassword: Edge function response:', response);

      if (response.status === 'already_joined') {
        toast.info(response.message);
      } else if (response.status === 'joined') {
        toast.success(`You successfully joined "${response.roomName}"!`);
        addNotification(`You joined the room: "${response.roomName}".`);
      } else if (response.status === 'pending_request') {
        toast.info(response.message);
      } else if (response.status === 'request_sent') {
        toast.info(response.message);
        addNotification(`New join request for "${response.roomName}" from ${session.user.email}.`, room.creator_id);
      }
      window.dispatchEvent(new CustomEvent('roomJoined', { detail: { roomId: resolvedRoomId, roomName: room.name } }));
      console.log('handleJoinRoomByPassword: After edge function, before fetchRooms');
      await fetchRooms(); // Re-fetch rooms to update membership status in UI
    } catch (error: any) {
      toast.error(`Failed to join room: ${error.message}`);
      console.error("Join room error:", error);
    }
  }, [session, supabase, rooms, fetchRooms, addNotification]);

  const handleJoinRoomByRoomId = useCallback(async (roomId: string) => {
    await handleJoinRoomByPassword(roomId, ""); // Call the main function with an empty password
  }, [handleJoinRoomByPassword]);

  const handleLeaveRoom = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to leave a room.");
      return;
    }

    const originalRooms = [...rooms];
    const roomToLeave = originalRooms.find(r => r.id === roomId);

    if (!roomToLeave) {
        toast.error("Room not found.");
        return;
    }

    if (roomToLeave.creator_id === session.user.id) {
      toast.error("You cannot leave a room you created. Please delete it instead.");
      return;
    }

    // Optimistic update:
    // If the room is private, leaving it means it disappears from the list.
    // If it's public, it should remain in the list but with is_member: false.
    if (roomToLeave.type === 'private') {
        setRooms(prev => prev.filter(r => r.id !== roomId));
    } else {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, is_member: false } : r));
    }

    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', session.user.id);

    if (error) {
      toast.error("Error leaving room: " + error.message);
      console.error("Error leaving room:", error);
      // Revert on error
      setRooms(originalRooms);
    } else {
      toast.success("Successfully left the room.");
      addNotification(`You left the room: "${roomToLeave.name}".`);
      await fetchRooms(); // Explicitly re-fetch rooms after leaving
    }
  }, [session, supabase, rooms, setRooms, addNotification, fetchRooms]);

  const handleKickUser = useCallback(async (roomId: string, userIdToKick: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to kick users.");
      return;
    }

    try {
      await invokeEdgeFunction('kick-room-member', {
        method: 'POST',
        body: { roomId, userIdToKick },
        accessToken: session.access_token,
      });
      toast.success("User kicked successfully!");
      await fetchRooms(); // Explicitly re-fetch rooms after kicking
      addNotification(`You were kicked from the room: "${rooms.find(r => r.id === roomId)?.name || roomId.substring(0, 8) + '...'}"`, userIdToKick);
    } catch (error: any) {
      toast.error(`Failed to kick user: ${error.message}`);
      console.error("Error kicking user:", error);
    }
  }, [session, supabase, fetchRooms, addNotification, rooms]);

  return {
    handleJoinRoomByPassword,
    handleJoinRoomByRoomId,
    handleLeaveRoom,
    handleKickUser,
  };
}