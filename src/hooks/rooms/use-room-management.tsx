"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";
import { getRandomBackground } from "@/lib/backgrounds";
import { useNotifications } from "@/hooks/use-notifications"; // Import useNotifications

interface UseRoomManagementProps {
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  fetchRooms: () => Promise<void>;
}

export function useRoomManagement({ setRooms, fetchRooms }: UseRoomManagementProps) {
  const { supabase, session } = useSupabase();
  const { addNotification } = useNotifications(); // Use the notifications hook

  const handleCreateRoom = useCallback(async (name: string, type: 'public' | 'private', description: string | null) => { // Added type and description parameters
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to create a room.");
      return { data: null, error: { message: "Not logged in" } }; // Return error object
    }

    const randomBg = getRandomBackground();
    const closesAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // Set closes_at to 2 hours from now

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        creator_id: session.user.id,
        name: name,
        background_url: randomBg.url,
        is_video_background: randomBg.isVideo,
        type: type, // Set the room type
        description: description, // Set the room description
        closes_at: closesAt, // Set the closes_at timestamp
      })
      .select(`
        id,
        creator_id,
        name,
        created_at,
        background_url,
        is_video_background,
        password_hash,
        type,
        closes_at,
        deleted_at,
        description,
        profiles!creator_id(first_name, last_name)
      `) // Select only necessary fields, remove direct creator join
      .single();

    if (error) {
      toast.error("Error creating room: " + error.message);
      console.error("Error creating room:", error);
      return { data: null, error }; // Return error object
    } else if (data) {
      toast.success(`Room "${data.name}" created successfully!`);
      // The fetchRooms() call will update the state in useRoomFetching,
      // so we don't need to manually update `setRooms` here.
      fetchRooms();
      addNotification(`You created a new room: "${data.name}".`);
      return { data: data as RoomData, error: null }; // Return data object
    }
    return { data: null, error: { message: "Unknown error creating room" } }; // Fallback
  }, [session, supabase, fetchRooms, addNotification]);

  const handleUpdateRoomType = useCallback(async (roomId: string, newType: 'public' | 'private') => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to update room settings.");
      return;
    }

    const { data: room, error: fetchRoomError } = await supabase
      .from('rooms')
      .select('creator_id, name, password_hash')
      .eq('id', roomId)
      .single();

    if (fetchRoomError || !room) {
      toast.error("Room not found or access denied.");
      console.error("Error fetching room for type update:", fetchRoomError);
      return;
    }

    if (room.creator_id !== session.user.id) {
      toast.error("You can only change the type of rooms you created.");
      return;
    }

    let updateData: { type: 'public' | 'private'; password_hash?: string | null } = { type: newType };

    // If changing to public, remove any password
    if (newType === 'public' && room.password_hash) {
      updateData.password_hash = null;
    }

    const { error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', roomId)
      .eq('creator_id', session.user.id);

    if (error) {
      toast.error("Error updating room type: " + error.message);
      console.error("Error updating room type:", error);
    } else {
      toast.success(`Room "${room.name}" is now ${newType}.`);
      fetchRooms(); // Re-fetch to update local state and other components
    }
  }, [session, supabase, fetchRooms]);

  const handleSetRoomPassword = useCallback(async (roomId: string, password: string | null) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to set a room password.");
      return;
    }

    const { data: room, error: fetchRoomError } = await supabase
      .from('rooms')
      .select('creator_id, name, type')
      .eq('id', roomId)
      .single();

    if (fetchRoomError || !room) {
      toast.error("Room not found or access denied.");
      console.error("Error fetching room for password update:", fetchRoomError);
      return;
    }

    if (room.creator_id !== session.user.id) {
      toast.error("You can only set passwords for rooms you created.");
      return;
    }

    if (room.type === 'public' && password) {
      toast.error("Cannot set a password for a public room. Change room type to private first.");
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
        toast.success(password ? "Room password set successfully!" : "Room password removed successfully!");
        fetchRooms(); // Re-fetch to update local state
      }
    } catch (error) {
      toast.error("Failed to set password due to network error.");
      console.error("Network error setting password:", error);
    }
  }, [session, supabase, fetchRooms]);

  const handleSendRoomInvitation = useCallback(async (roomId: string, receiverEmail: string) => { // Changed receiverId to receiverEmail
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to send invitations.");
      return;
    }

    // 1. Get receiver's user ID from email using Edge Function
    let receiverId: string | null = null;
    try {
      const response = await fetch('https://mrdupsekghsnbooyrdmj.supabase.co/functions/v1/get-user-id-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Use user's token for RLS
        },
        body: JSON.stringify({ email: receiverEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Error finding user: " + (data.error || "User not found."));
        console.error("Error finding user by email:", data.error);
        return;
      }
      receiverId = data.userId;
    } catch (error) {
      toast.error("Failed to find user by email due to network error.");
      console.error("Network error finding user by email:", error);
      return;
    }

    if (!receiverId) {
      toast.error("Could not find a user with that email address.");
      return;
    }

    // Verify room ownership
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('creator_id, name')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      toast.error("Room not found or access denied.");
      console.error("Error fetching room for sending invitation:", roomError);
      return;
    }

    if (room.creator_id !== session.user.id) {
      toast.error("Forbidden: You are not the room creator.");
      return;
    }

    if (receiverId === session.user.id) {
      toast.info("You cannot send an invitation to yourself.");
      return;
    }

    // Check if receiver is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', receiverId)
      .single();

    if (existingMember) {
      toast.info("This user is already a member of this room.");
      return;
    }

    // Check if a pending invitation already exists
    const { data: existingInvitation, error: invitationCheckError } = await supabase
      .from('room_invitations')
      .select('id')
      .eq('room_id', roomId)
      .eq('receiver_id', receiverId)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      toast.info("A pending invitation for this user already exists for this room.");
      return;
    }

    const { data: newInvitation, error: insertError } = await supabase
      .from('room_invitations')
      .insert({ room_id: roomId, sender_id: session.user.id, receiver_id: receiverId, status: 'pending' })
      .select()
      .single();

    if (insertError) {
      toast.error("Error sending invitation: " + insertError.message);
      console.error("Error sending invitation:", insertError);
    } else if (newInvitation) {
      toast.success("Invitation sent successfully!");
      addNotification(`You received an invitation to join "${room.name}".`, receiverId); // Notify the invited user
    }
  }, [session, supabase, addNotification]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to delete a room.");
      return;
    }

    const { data: roomToDelete, error: fetchRoomError } = await supabase
      .from('rooms')
      .select('name, creator_id')
      .eq('id', roomId)
      .single();

    if (fetchRoomError || !roomToDelete) {
      toast.error("Room not found or you don't have permission.");
      console.error("Error fetching room for deletion:", fetchRoomError);
      return;
    }

    if (roomToDelete.creator_id !== session.user.id) {
      toast.error("You can only delete rooms you created.");
      return;
    }

    // Perform a soft delete by setting deleted_at timestamp
    // Explicitly select 'id' to avoid RLS violation on implicit full row return
    const { data, error } = await supabase
      .from('rooms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', roomId)
      .eq('creator_id', session.user.id)
      .select('id'); // Explicitly select 'id' to avoid RLS issue

    if (error) {
      toast.error("Error deleting room: " + error.message);
      console.error("Error deleting room:", error);
    } else if (data) {
      fetchRooms(); // Re-fetch to update local state immediately
      toast.success("Room deleted successfully.");
      addNotification(`You deleted the room: "${roomToDelete.name}".`);
    }
  }, [session, supabase, fetchRooms, addNotification]);

  const handleUpdateRoomDescription = useCallback(async (roomId: string, newDescription: string | null) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to update room settings.");
      return;
    }

    const { data: room, error: fetchRoomError } = await supabase
      .from('rooms')
      .select('creator_id, name')
      .eq('id', roomId)
      .single();

    if (fetchRoomError || !room) {
      toast.error("Room not found or access denied.");
      console.error("Error fetching room for description update:", fetchRoomError);
      return;
    }

    if (room.creator_id !== session.user.id) {
      toast.error("You can only change the description of rooms you created.");
      return;
    }

    const { error } = await supabase
      .from('rooms')
      .update({ description: newDescription })
      .eq('id', roomId)
      .eq('creator_id', session.user.id);

    if (error) {
      toast.error("Error updating room description: " + error.message);
      console.error("Error updating room description:", error);
    } else {
      toast.success(`Room "${room.name}" description updated!`);
      fetchRooms(); // Re-fetch to update local state
    }
  }, [session, supabase, fetchRooms]);

  const handleUpdateRoomBackground = useCallback(async (roomId: string, backgroundUrl: string, isVideoBackground: boolean) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to update room settings.");
      return;
    }

    const { data: room, error: fetchRoomError } = await supabase
      .from('rooms')
      .select('creator_id, name')
      .eq('id', roomId)
      .single();

    if (fetchRoomError || !room) {
      toast.error("Room not found or access denied.");
      console.error("Error fetching room for background update:", fetchRoomError);
      return;
    }

    if (room.creator_id !== session.user.id) {
      toast.error("You can only change the background of rooms you created.");
      return;
    }

    const { error } = await supabase
      .from('rooms')
      .update({ background_url: backgroundUrl, is_video_background: isVideoBackground })
      .eq('id', roomId)
      .eq('creator_id', session.user.id);

    if (error) {
      toast.error("Error updating room background: " + error.message);
      console.error("Error updating room background:", error);
    } else {
      toast.success(`Room "${room.name}" background updated!`);
      fetchRooms(); // Re-fetch to update local state
    }
  }, [session, supabase, fetchRooms]);

  return {
    handleCreateRoom,
    handleUpdateRoomType,
    handleSetRoomPassword,
    handleSendRoomInvitation,
    handleDeleteRoom,
    handleUpdateRoomDescription,
    handleUpdateRoomBackground,
  };
}