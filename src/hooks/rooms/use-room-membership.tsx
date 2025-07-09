"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";
import { useNotifications } from "@/hooks/use-notifications"; // Import useNotifications

interface UseRoomMembershipProps {
  rooms: RoomData[];
  fetchRooms: () => Promise<void>;
}

export function useRoomMembership({ rooms, fetchRooms }: UseRoomMembershipProps) {
  const { supabase, session } = useSupabase();
  const { addNotification } = useNotifications(); // Use the notifications hook

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

    // Attempt to insert the user into room_members
    const { data: newMember, error: insertError } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: session.user.id })
      .select()
      .single();

    if (insertError) {
      toast.error("Error joining room: " + insertError.message);
      console.error("Error joining room:", insertError);
    } else if (newMember) {
      toast.success(`Successfully joined room: "${room.name}"!`);
      fetchRooms(); // Re-fetch rooms to update membership status
      addNotification(`You joined the room: "${room.name}".`);
    }

  }, [session, supabase, rooms, fetchRooms, addNotification]);

  // Removed handleJoinRoomByPassword

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
        addNotification(`You were kicked from the room: "${rooms.find(r => r.id === roomId)?.name || roomId.substring(0, 8) + '...'}"`, userIdToKick); // Notify the kicked user
      }
    } catch (error) {
      toast.error("Failed to kick user due to network error.");
      console.error("Network error kicking user:", error);
    }
  }, [session, supabase, fetchRooms, addNotification, rooms]);

  return {
    handleJoinRoomByRoomId,
    handleLeaveRoom,
    handleKickUser,
  };
}