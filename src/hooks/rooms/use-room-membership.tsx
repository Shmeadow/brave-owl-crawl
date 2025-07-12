"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";
import { useNotifications } from "@/hooks/use-notifications";

interface UseRoomMembershipProps {
  rooms: RoomData[];
  fetchRooms: () => Promise<void>;
}

export function useRoomMembership({ rooms, fetchRooms }: UseRoomMembershipProps) {
  const { supabase, session } = useSupabase();
  const { addNotification } = useNotifications();

  const handleJoinRoomByRoomId = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to join a room.");
      return;
    }

    const room = rooms.find(r => r.id === roomId);

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

    // If room is private, it cannot be joined by ID directly (needs invite or password)
    // Or, if no password, it will create a join request
    if (room.type === 'private') {
      if (room.password_hash) {
        toast.error("This is a private room with a password. Please use 'Join by Password' tab.");
        return;
      } else {
        // Private room with no password, create a join request
        const { data: existingRequest, error: checkError } = await supabase
          .from('room_join_requests')
          .select('id')
          .eq('room_id', roomId)
          .eq('requester_id', session.user.id)
          .in('status', ['pending', 'accepted']); // Check for pending or already accepted requests

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
          .insert({ room_id: roomId, requester_id: session.user.id, status: 'pending' });

        if (requestError) {
          console.error("Error creating join request:", requestError);
          toast.error("Failed to send join request: " + requestError.message);
          return;
        }

        toast.success(`Request to join "${room.name}" sent to room owner.`);
        addNotification(`New join request for "${room.name}" from ${session.user.email}.`, room.creator_id);
        return;
      }
    }

    // For public rooms without password, allow direct join
    const { error: memberInsertError } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: session.user.id });

    if (memberInsertError) {
      toast.error("Error joining room: " + memberInsertError.message);
      console.error("Error inserting room member:", memberInsertError);
      return;
    }

    toast.success(`You successfully joined "${room.name}"!`);
    fetchRooms();
    addNotification(`You joined the room: "${room.name}".`);

  }, [session, supabase, rooms, fetchRooms, addNotification]);

  const handleJoinRoomByPassword = useCallback(async (roomId: string, passwordAttempt: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to join a room.");
      return;
    }

    const room = rooms.find(r => r.id === roomId);

    if (!room) {
      toast.error("Room not found.");
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

    // Only private rooms can be joined by password
    if (room.type === 'public') {
      toast.error("This is a public room and does not require a password. Use 'Join by Room ID' instead.");
      return;
    }

    if (!room.password_hash) {
      // If it's a private room but has no password, it requires a join request
      toast.error("This private room does not have a password set. A join request will be sent to the owner.");
      // Instead of returning, create a join request
      const { data: existingRequest, error: checkError } = await supabase
          .from('room_join_requests')
          .select('id')
          .eq('room_id', roomId)
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
          .insert({ room_id: roomId, requester_id: session.user.id, status: 'pending' });

        if (requestError) {
          console.error("Error creating join request:", requestError);
          toast.error("Failed to send join request: " + requestError.message);
          return;
        }

        toast.success(`Request to join "${room.name}" sent to room owner.`);
        addNotification(`New join request for "${room.name}" from ${session.user.email}.`, room.creator_id);
        return;
    }

    // Use the check_password RPC function
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

    // If password matches, insert into room_members
    const { error: memberInsertError } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: session.user.id });

    if (memberInsertError) {
      toast.error("Error joining room: " + memberInsertError.message);
      console.error("Error inserting room member:", memberInsertError);
      return;
    }

    toast.success(`You successfully joined "${room.name}"!`);
    fetchRooms();
    addNotification(`You joined the room: "${room.name}".`);

  }, [session, supabase, rooms, fetchRooms, addNotification]);

  const handleLeaveRoom = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to leave a room.");
      return;
    }

    const room = rooms.find(r => r.id === roomId);
    if (room && room.creator_id === session.user.id) {
      toast.error("You cannot leave a room you created. Please delete it instead.");
      return;
    }

    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', session.user.id);

    if (error) {
      toast.error("Error leaving room: " + error.message);
      console.error("Error leaving room:", error);
    } else {
      toast.success("Successfully left the room.");
      fetchRooms();
      addNotification(`You left the room: "${room?.name || roomId.substring(0, 8) + '...'}"`);
    }
  }, [session, supabase, rooms, fetchRooms, addNotification]);

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
    handleJoinRoomByRoomId,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
  };
}