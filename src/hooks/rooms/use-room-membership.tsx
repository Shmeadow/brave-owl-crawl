"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";

interface UseRoomMembershipProps {
  rooms: RoomData[];
  fetchRooms: () => Promise<void>;
}

export function useRoomMembership({ rooms, fetchRooms }: UseRoomMembershipProps) {
  const { supabase, session } = useSupabase();

  const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 alphanumeric characters
  };

  const handleGenerateInviteCode = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to generate an invite code.");
      return null;
    }

    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('creator_id, is_public')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData || roomData.creator_id !== session.user.id) {
      toast.error("You can only generate invite codes for rooms you own.");
      return null;
    }

    if (roomData.is_public) {
      toast.info("Public rooms do not need invite codes.");
      return null;
    }

    const { data: existingInvites, error: existingInvitesError } = await supabase
      .from('room_invites')
      .select('code')
      .eq('room_id', roomId)
      .eq('creator_id', session.user.id)
      .is('expires_at', null);

    if (existingInvitesError) {
      console.error("Error checking existing invites:", existingInvitesError);
      toast.error("Error checking existing invites.");
      return null;
    }

    if (existingInvites && existingInvites.length > 0) {
      toast.info(`An active invite code already exists for this room: ${existingInvites[0].code}`);
      return existingInvites[0].code;
    }

    let newCode = generateRandomCode();
    let isCodeUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (!isCodeUnique && attempts < MAX_ATTEMPTS) {
      const { data: existingCode, error: codeCheckError } = await supabase
        .from('room_invites')
        .select('id')
        .eq('code', newCode)
        .single();

      if (codeCheckError && codeCheckError.code === 'PGRST116') {
        isCodeUnique = true;
      } else if (codeCheckError) {
        console.error("Error checking code uniqueness:", codeCheckError);
        toast.error("Error generating invite code.");
        return null;
      } else {
        newCode = generateRandomCode();
        attempts++;
      }
    }

    if (!isCodeUnique) {
      toast.error("Failed to generate a unique invite code after multiple attempts.");
      return null;
    }

    const { data: inviteData, error: insertError } = await supabase
      .from('room_invites')
      .insert({
        room_id: roomId,
        code: newCode,
        creator_id: session.user.id,
        expires_at: null,
      })
      .select()
      .single();

    if (insertError) {
      toast.error("Error creating invite code: " + insertError.message);
      console.error("Error creating invite code:", insertError);
      return null;
    } else if (inviteData) {
      toast.success(`Invite code "${inviteData.code}" generated!`);
      return inviteData.code;
    }
    return null;
  }, [session, supabase]);

  const handleJoinRoomByCode = useCallback(async (code: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to join a room.");
      return;
    }

    const { data: invite, error: inviteError } = await supabase
      .from('room_invites')
      .select('room_id, expires_at')
      .eq('code', code)
      .single();

    if (inviteError || !invite) {
      toast.error("Invalid or expired invite code.");
      console.error("Error fetching invite:", inviteError);
      return;
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      toast.error("This invite code has expired.");
      return;
    }

    const { data: existingMembership, error: membershipError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', invite.room_id)
      .eq('user_id', session.user.id)
      .single();

    if (existingMembership) {
      toast.info("You are already a member of this room.");
      return;
    }

    const { data: newMembership, error: insertError } = await supabase
      .from('room_members')
      .insert({
        room_id: invite.room_id,
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

  const handleSendJoinRequest = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to send a join request.");
      return;
    }

    // Validate Room ID format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      toast.error("Invalid Room ID format. Please enter a valid UUID.");
      return;
    }

    // Check if the room exists and is not public
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, creator_id, is_public')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      toast.error("Room not found or you do not have access to request to join it.");
      console.error("Error fetching room for join request:", roomError);
      return;
    }

    if (room.is_public) {
      toast.info("This is a public room. You can join it directly from the 'Public Rooms' list.");
      return;
    }

    if (room.creator_id === session.user.id) {
      toast.info("You are the creator of this room. You are already a member.");
      return;
    }

    // Check if already a member
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

    // Check if a pending request already exists
    const { data: existingRequest, error: requestError } = await supabase
      .from('room_join_requests')
      .select('id, status')
      .eq('room_id', roomId)
      .eq('requester_id', session.user.id)
      .in('status', ['pending', 'accepted']); // Check for pending or already accepted requests

    if (requestError) {
      console.error("Error checking existing join request:", requestError);
      toast.error("Error checking for existing join request.");
      return;
    }

    if (existingRequest && existingRequest.length > 0) {
      if (existingRequest[0].status === 'pending') {
        toast.info("You already have a pending join request for this room.");
      } else if (existingRequest[0].status === 'accepted') {
        toast.info("You have already been accepted into this room. Please refresh your rooms list.");
      }
      return;
    }

    // Check if the requesting user is blocked by the room creator
    const { data: blockedStatus, error: blockedError } = await supabase
      .from('blocked_users')
      .select('id, type')
      .eq('blocker_id', room.creator_id)
      .eq('blocked_id', session.user.id)
      .single();

    if (blockedError && blockedError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error checking blocked status:", blockedError);
      toast.error("An error occurred while checking block status.");
      return;
    }

    if (blockedStatus) {
      if (blockedStatus.type === 'block') {
        toast.error("You are blocked by the owner of this room and cannot send join requests.");
        return;
      } else if (blockedStatus.type === 'mute') {
        toast.info("Your requests to this room's owner are currently muted. They may not receive this notification.");
        // Still allow sending, but inform the user
      }
    }

    // Insert new join request
    const { error: insertError } = await supabase
      .from('room_join_requests')
      .insert({
        room_id: roomId,
        requester_id: session.user.id,
        status: 'pending',
      });

    if (insertError) {
      toast.error("Error sending join request: " + insertError.message);
      console.error("Error inserting join request:", insertError);
    } else {
      toast.success("Join request sent successfully! The room owner will be notified.");
    }
  }, [session, supabase]);

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
    handleGenerateInviteCode,
    handleJoinRoomByCode,
    handleJoinRoomByPassword,
    handleSendJoinRequest, // Export the new function
    handleLeaveRoom,
    handleKickUser,
  };
}