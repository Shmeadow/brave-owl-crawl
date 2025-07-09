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

  const handleCreateRoom = useCallback(async (name: string) => { // Removed isPublic parameter
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to create a room.");
      return { data: null, error: { message: "Not logged in" } }; // Return error object
    }

    const randomBg = getRandomBackground();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        creator_id: session.user.id,
        name: name,
        background_url: randomBg.url,
        is_video_background: randomBg.isVideo,
      })
      .select('*, creator:profiles(first_name, last_name)')
      .single();

    if (error) {
      toast.error("Error creating room: " + error.message);
      console.error("Error creating room:", error);
      return { data: null, error }; // Return error object
    } else if (data) {
      toast.success(`Room "${data.name}" created successfully!`);
      setRooms((prevRooms) => [...prevRooms, { ...data, is_member: true } as RoomData]);
      addNotification(`You created a new room: "${data.name}".`);
      return { data: data as RoomData, error: null }; // Return data object
    }
    return { data: null, error: { message: "Unknown error creating room" } }; // Fallback
  }, [session, supabase, setRooms, addNotification]);

  // Removed handleToggleRoomPublicStatus
  // Removed handleToggleGuestWriteAccess
  // Removed handleSetRoomPassword

  const handleSendRoomInvitation = useCallback(async (roomId: string, receiverId: string) => {
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
    const { error } = await supabase
      .from('rooms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', roomId)
      .eq('creator_id', session.user.id); // Ensure only creator can delete

    if (error) {
      toast.error("Error deleting room: " + error.message);
      console.error("Error deleting room:", error);
    } else {
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId)); // Remove from local state immediately
      toast.success("Room deleted successfully.");
      addNotification(`You deleted the room: "${roomToDelete.name}".`);
    }
  }, [session, supabase, setRooms, addNotification]);

  return {
    handleCreateRoom,
    handleSendRoomInvitation, // Renamed and updated
    handleDeleteRoom,
  };
}