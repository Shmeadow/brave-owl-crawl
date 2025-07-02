"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface RoomData {
  id: string;
  creator_id: string;
  name: string;
  is_public: boolean;
  allow_guest_write: boolean; // New field
  password_hash: string | null; // New field
  created_at: string;
  is_member?: boolean; // Client-side flag to indicate if the current user is a member
}

export interface RoomInvite {
  id: string;
  room_id: string;
  code: string;
  creator_id: string;
  expires_at: string | null;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  } | null;
}

export function useRooms() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (authLoading || !supabase) return;

    setLoading(true);
    
    let allRooms: RoomData[] = [];

    // Fetch public rooms
    const { data: publicRooms, error: publicError } = await supabase
      .from('rooms')
      .select('*, room_members(user_id)') // Select room_members to check if current user is a member
      .eq('is_public', true)
      .order('created_at', { ascending: true });

    if (publicError) {
      toast.error("Error fetching public rooms: " + publicError.message);
      console.error("Error fetching public rooms:", publicError);
    } else {
      allRooms = publicRooms.map(room => ({
        ...room,
        is_member: session?.user?.id ? room.room_members.some((m: any) => m.user_id === session.user.id) : false,
      })) as RoomData[];
    }

    // If logged in, fetch rooms created by user and rooms user is a member of
    if (session?.user?.id) {
      // Fetch rooms created by the user
      const { data: userCreatedRooms, error: createdError } = await supabase
        .from('rooms')
        .select('*, room_members(user_id)')
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: true });

      if (createdError) {
        toast.error("Error fetching your created rooms: " + createdError.message);
        console.error("Error fetching created rooms:", createdError);
      } else {
        // Add user-created rooms, avoiding duplicates if they are also public
        userCreatedRooms.forEach(room => {
          if (!allRooms.some(r => r.id === room.id)) {
            allRooms.push({
              ...room,
              is_member: true, // Creator is always a member
            } as RoomData);
          } else {
            // If it's a public room created by user, ensure is_member is true
            const existingRoom = allRooms.find(r => r.id === room.id);
            if (existingRoom) existingRoom.is_member = true;
          }
        });
      }

      // Fetch rooms the user is a member of (excluding their own created rooms)
      const { data: memberships, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', session.user.id);

      if (memberError) {
        toast.error("Error fetching room memberships: " + memberError.message);
        console.error("Error fetching memberships:", memberError);
      } else if (memberships) {
        const memberRoomIds = new Set(memberships.map(m => m.room_id));
        
        // Fetch details for rooms the user is a member of, if not already fetched
        const { data: memberRooms, error: memberRoomsError } = await supabase
          .from('rooms')
          .select('*, room_members(user_id)')
          .in('id', Array.from(memberRoomIds))
          .order('created_at', { ascending: true });

        if (memberRoomsError) {
          toast.error("Error fetching member rooms: " + memberRoomsError.message);
          console.error("Error fetching member rooms:", memberRoomsError);
        } else if (memberRooms) {
          memberRooms.forEach(room => {
            if (!allRooms.some(r => r.id === room.id)) {
              allRooms.push({ ...room, is_member: true } as RoomData);
            } else {
              // Mark as member if already in allRooms (e.g., public room user is also a member of)
              const existingRoom = allRooms.find(r => r.id === room.id);
              if (existingRoom) existingRoom.is_member = true;
            }
          });
        }
      }
    }

    // Sort all rooms by creation date
    allRooms.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setRooms(allRooms);
    setLoading(false);
  }, [supabase, session, authLoading]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = useCallback(async (name: string, isPublic: boolean = false) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to create a room.");
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        creator_id: session.user.id,
        name: name,
        is_public: isPublic,
        allow_guest_write: false, // Default to false
        password_hash: null, // Default to null
      })
      .select()
      .single();

    if (error) {
      toast.error("Error creating room: " + error.message);
      console.error("Error creating room:", error);
    } else if (data) {
      // Add the new room with is_member: true since creator is always a member
      setRooms((prevRooms) => [...prevRooms, { ...data, is_member: true } as RoomData]);
      toast.success(`Room "${data.name}" created successfully! It is currently ${data.is_public ? 'public' : 'private'}.`);
    }
  }, [session, supabase]);

  const handleToggleRoomPublicStatus = useCallback(async (roomId: string, currentStatus: boolean) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to change room status.");
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ is_public: !currentStatus })
      .eq('id', roomId)
      .eq('creator_id', session.user.id) // Ensure only creator can change status
      .select()
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
  }, [session, supabase]);

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
      .select()
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
  }, [session, supabase]);

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
        // Update local state with the new password hash (or null if removed)
        setRooms(prevRooms => prevRooms.map(room =>
          room.id === roomId ? { ...room, password_hash: password ? 'SET' : null } : room // 'SET' is a placeholder, actual hash is not returned
        ));
        toast.success(password ? "Room password set successfully!" : "Room password removed.");
        fetchRooms(); // Re-fetch to get the actual state if needed, or just rely on placeholder
      }
    } catch (error) {
      toast.error("Failed to set password due to network error.");
      console.error("Network error setting password:", error);
    }
  }, [session, supabase, fetchRooms]);

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
        fetchRooms(); // Re-fetch rooms to update membership lists
      }
    } catch (error) {
      toast.error("Failed to kick user due to network error.");
      console.error("Network error kicking user:", error);
    }
  }, [session, supabase, fetchRooms]);

  const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 alphanumeric characters
  };

  const handleGenerateInviteCode = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to generate an invite code.");
      return null;
    }

    // Check if the user is the creator of the room
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

    // Check for existing active invite codes for this room
    const { data: existingInvites, error: existingInvitesError } = await supabase
      .from('room_invites')
      .select('code')
      .eq('room_id', roomId)
      .eq('creator_id', session.user.id)
      .is('expires_at', null); // Only consider non-expiring invites for simplicity

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

    // Ensure code is unique
    while (!isCodeUnique && attempts < MAX_ATTEMPTS) {
      const { data: existingCode, error: codeCheckError } = await supabase
        .from('room_invites')
        .select('id')
        .eq('code', newCode)
        .single();

      if (codeCheckError && codeCheckError.code === 'PGRST116') { // No rows found
        isCodeUnique = true;
      } else if (codeCheckError) {
        console.error("Error checking code uniqueness:", codeCheckError);
        toast.error("Error generating invite code.");
        return null;
      } else {
        newCode = generateRandomCode(); // Generate new code if not unique
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
        expires_at: null, // For simplicity, making them non-expiring for now
      })
      .select()
      .single();

    if (insertError) {
      toast.error("Error creating invite code: " + insertError.message);
      console.error("Error creating invite code:", insertError);
      return null;
    } else if (inviteData) {
      toast.success(`Invite code "${inviteData.code}" generated for "${roomData.name}"!`);
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

    // Check if already a member
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
      fetchRooms(); // Re-fetch rooms to update the list
    }
  }, [session, supabase, fetchRooms]);

  const handleJoinRoomByPassword = useCallback(async (roomId: string, passwordAttempt: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to join a room.");
      return;
    }

    // Fetch room details including password_hash
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

    // Verify password using pgcrypto's check function via a database function
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

    // If password matches, proceed to join the room (similar to invite code join)
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
      fetchRooms(); // Re-fetch rooms to update the list
    }
  }, [session, supabase, fetchRooms]);

  const handleLeaveRoom = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to leave a room.");
      return;
    }

    // Prevent leaving your own created room (you can delete it instead)
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
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      toast.success("Successfully left the room.");
      fetchRooms(); // Re-fetch rooms to update the list
    }
  }, [session, supabase, rooms, fetchRooms]);

  return {
    rooms,
    loading,
    handleCreateRoom,
    handleToggleRoomPublicStatus,
    handleToggleGuestWriteAccess, // Expose new function
    handleSetRoomPassword, // Expose new function
    handleKickUser, // Expose new function
    handleGenerateInviteCode,
    handleJoinRoomByCode,
    handleJoinRoomByPassword, // Expose new function
    handleLeaveRoom,
    fetchRooms,
  };
}