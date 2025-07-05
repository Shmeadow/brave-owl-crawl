"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";

interface UseRoomMembershipProps {
  rooms: RoomData[];
  fetchRooms: () => Promise<void>;
}

// Removed generateRandomCode as it's no longer needed

export function useRoomMembership({ rooms, fetchRooms }: UseRoomMembershipProps) {
  const { supabase, session } = useSupabase();

  // Removed handleGenerateInviteCode

  const handleJoinRoomByRoomId = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to join a room.");
      return;
    }

    // Check if the room exists and is public, or if it has a password (handled by password join)
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('id, is_public, password_hash')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      toast.error("Room not found or inaccessible.");
      console.error("Error fetching room for join:", roomError);
      return;
    }

    if (!roomData.is_public && !roomData.password_hash) {
      toast.error("This is a private room and requires a password to join.");
      return;
    }

    const { data: existingMembership, error: membershipError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', session.user.id)
      .single();

    if (existingMembership) {
      toast.info("You are already a member of this room.");
      return;
    }

    const { data: newMembership, error: insertError } = await supabase
      .from('room_members')
      .insert({
        room_id: roomId,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (insertError) {
      toast.error("Error joining room: " + insertError.message);
      console.error("Error inserting membership:", insertError);
    } else if (newMembership) {
      toast.success("Successfully joined the room!");
      fetchRooms();
    }
  }, [session, supabase, fetchRooms]);

  const handleJoinRoomByPassword = useCallback(async (roomId: string, passwordAttempt: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to join a room.");
      return;
    }

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('password_hash')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      toast.error("Room not found.");
      console.error("Error fetching room for password check:", roomError);
      return;
    }

    if (!room.password_hash) {
      toast.error("This room does not have a password set.");
      return;
    }

    const { data: passwordMatch, error: checkError } = await supabase.rpc('check_password', {
      _password_attempt: passwordAttempt,
      _password_hash: room.password_hash,
    });

    if (checkError) {
      console.error('Password check error:', checkError);
      toast.error("An error occurred during password verification.");
      return;
    }

    if (!passwordMatch) {
      toast.error("Incorrect password.");
      return;
    }

    const { data: existingMembership, error: membershipError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', session.user.id)
      .single();

    if (existingMembership) {
      toast.info("You are already a member of this room.");
      return;
    }

    const { data: newMembership, error: insertError } = await supabase
      .from('room_members')
      .insert({
        room_id: roomId,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (insertError) {
      toast.error("Error joining room: " + insertError.message);
      console.error("Error inserting membership:", insertError);
    } else if (newMembership) {
      toast.success("Successfully joined the room!");
      fetchRooms();
    }
  }, [session, supabase, fetchRooms]);

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
    }
  }, [session, supabase, rooms, fetchRooms]);

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
      }
    } catch (error) {
      toast.error("Failed to kick user due to network error.");
      console.error("Network error kicking user:", error);
    }
  }, [session, supabase, fetchRooms]);

  return {
    // Removed handleGenerateInviteCode
    handleJoinRoomByRoomId, // Renamed and updated
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
  };
}