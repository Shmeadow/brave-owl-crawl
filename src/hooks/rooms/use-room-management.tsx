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

    // Check if the user already owns an *active* room
    const nowIso = new Date().toISOString();
    const { data: existingRooms, error: existingRoomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('creator_id', session.user.id)
      .is('deleted_at', null) // Only count non-soft-deleted rooms
      .gt('closes_at', nowIso); // Only count non-expired rooms

    if (existingRoomsError) {
      console.error("Error checking for existing rooms:", existingRoomsError);
      toast.error("Failed to check for existing rooms.");
      return { data: null, error: existingRoomsError };
    }

    if (existingRooms && existingRooms.length > 0) {
      toast.error("You can only create one room. Please manage your existing room.");
      return { data: null, error: { message: "User already owns an active room" } };
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

    // Simplified: Just send a notification to the user if they exist.
    // In a real app, you'd want to get the user ID from the email first.
    // For now, we'll just create a generic notification.
    // This part is simplified as we removed the get-user-id-by-email function.
    toast.info(`An invitation email would be sent to ${receiverEmail} for the room "${room.name}". (This is a mock-up as direct user-to-user invites are complex).`);
    // In a full implementation, you would use the receiver's ID to create a notification for them.
    // addNotification(`You have been invited to join "${room.name}".`, receiverId);

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