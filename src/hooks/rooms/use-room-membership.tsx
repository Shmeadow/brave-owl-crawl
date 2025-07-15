"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";
import { useNotifications } from "@/hooks/use-notifications";
import { SupabaseClient } from "@supabase/supabase-js";

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

    const resolvedRoomId = await resolveRoomId(supabase, idInput);

    if (!resolvedRoomId) {
      toast.error("Room or User not found.");
      return;
    }

    const room = rooms.find(r => r.id === resolvedRoomId);

    if (!room) {
      toast.error("Room not found or you don't have access.");
      return;
    }

    if (room.creator_id === session.user.id) {
      toast.info("You are the creator of this room.");
      return;
    }

    if (room.is_member) {
      toast.info("You are already a member of this room.");
      return;
    }

    // If public, join directly
    if (room.type === 'public') {
      const { error: memberInsertError } = await supabase
        .from('room_members')
        .insert({ room_id: resolvedRoomId, user_id: session.user.id });

      if (memberInsertError) {
        toast.error("Error joining room: " + memberInsertError.message);
        return;
      }
      toast.success(`You successfully joined "${room.name}"!`);
      // Dispatch event to update current room immediately
      window.dispatchEvent(new CustomEvent('roomJoined', { detail: { roomId: resolvedRoomId, roomName: room.name } }));
      fetchRooms();
      addNotification(`You joined the room: "${room.name}".`);
      return;
    }

    // If private, check password if it exists
    if (room.type === 'private' && room.password_hash) {
      if (!passwordAttempt) {
        toast.error("This private room requires a password.");
        return;
      }
      const { data: passwordMatch, error: rpcError } = await supabase.rpc('check_password', {
        _password_attempt: passwordAttempt,
        _password_hash: room.password_hash,
      });

      if (rpcError) {
        console.error("Error checking password:", rpcError);
        toast.error("An error occurred while verifying password.");
        return;
      }

      if (!passwordMatch) {
        toast.error("Incorrect password.");
        return;
      }
      
      // If password is correct, join the room
      const { error: memberInsertError } = await supabase
        .from('room_members')
        .insert({ room_id: resolvedRoomId, user_id: session.user.id });

      if (memberInsertError) {
        toast.error("Error joining room: " + memberInsertError.message);
        return;
      }
      toast.success(`You successfully joined "${room.name}"!`);
      // Dispatch event to update current room immediately
      window.dispatchEvent(new CustomEvent('roomJoined', { detail: { roomId: resolvedRoomId, roomName: room.name } }));
      fetchRooms();
      addNotification(`You joined the room: "${room.name}".`);
      return;
    }

    // If private and no password, it's invite-only, so send a join request
    if (room.type === 'private' && !room.password_hash) {
      const { data: existingRequest, error: checkError } = await supabase
        .from('room_join_requests')
        .select('id')
        .eq('room_id', resolvedRoomId)
        .eq('requester_id', session.user.id)
        .in('status', ['pending', 'accepted']);

      if (checkError) {
        console.error("Error checking existing join request:", checkError);
        toast.error("Failed to check for existing join request.");
        return;
      }

      if (existingRequest && existingRequest.length > 0) {
        toast.info("You already have a pending join request for this room.");
        return;
      }

      const { error: requestError } = await supabase
        .from('room_join_requests')
        .insert({ room_id: resolvedRoomId, requester_id: session.user.id, status: 'pending' });

      if (requestError) {
        console.error("Error creating join request:", requestError);
        toast.error("Failed to send join request: " + requestError.message);
        return;
      }

      toast.success(`Request to join "${room.name}" sent to room owner.`);
      addNotification(`New join request for "${room.name}" from ${session.user.email}.`, room.creator_id);
      return;
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
    }
  }, [session, supabase, rooms, setRooms, addNotification]);

  const handleKickUser = useCallback(async (roomId: string, userIdToKick: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to kick users.");
      return;
    }

    try {
      const response = await fetch('https://mrdupsekghsnbooyrdmj.supabase.co/functions/v1/kick-room-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roomId, userIdToKick }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Error kicking user: " + (data.error || "Unknown error"));
        console.error("Error kicking user:", data.error);
      } else {
        toast.success("User kicked successfully!");
        fetchRooms();
        addNotification(`You were kicked from the room: "${rooms.find(r => r.id === roomId)?.name || roomId.substring(0, 8) + '...'}"`, userIdToKick);
      }
    } catch (error) {
      toast.error("Failed to kick user due to network error.");
      console.error("Network error kicking user:", error);
    }
  }, [session, supabase, fetchRooms, addNotification, rooms]);

  return {
    handleJoinRoomByPassword,
    handleJoinRoomByRoomId,
    handleLeaveRoom,
    handleKickUser,
  };
}