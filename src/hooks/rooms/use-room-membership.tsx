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
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
      const { data: existingCodeData, error: codeCheckError } = await supabase // eslint-disable-line @typescript-eslint/no-unused-vars
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

    const { data: existingMembership } = await supabase // Removed membershipError
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

    const { data: existingMembership } = await supabase // Removed membershipError
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
    handleGenerateInviteCode,
    handleJoinRoomByCode,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
  };
}