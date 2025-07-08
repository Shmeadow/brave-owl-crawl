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
      return;
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
    } else if (data) {
      toast.success(`Room "${data.name}" created successfully!`);
      setRooms((prevRooms) => [...prevRooms, { ...data, is_member: true } as RoomData]);
      addNotification(`You created a new room: "${data.name}".`);
    }
  }, [session, supabase, setRooms, addNotification]);

  // Removed handleToggleRoomPublicStatus
  // Removed handleToggleGuestWriteAccess
  // Removed handleSetRoomPassword

  const handleAddRoomMember = useCallback(async (roomId: string, userIdToAdd: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to add members.");
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
      console.error("Error fetching room for adding member:", roomError);
      return;
    }

    if (room.creator_id !== session.user.id) {
      toast.error("Forbidden: You are not the room creator.");
      return;
    }

    if (userIdToAdd === session.user.id) {
      toast.info("You are already the creator of this room.");
      return;
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userIdToAdd)
      .single();

    if (existingMember) {
      toast.info("User is already a member of this room.");
      return;
    }

    const { data: newMember, error: insertError } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: userIdToAdd })
      .select()
      .single();

    if (insertError) {
      toast.error("Error adding member: " + insertError.message);
      console.error("Error adding member:", insertError);
    } else if (newMember) {
      toast.success("Member added successfully!");
      fetchRooms(); // Re-fetch to update room_members list
      addNotification(`You were added to the room: "${room.name}".`, userIdToAdd); // Notify the added user
    }
  }, [session, supabase, fetchRooms, addNotification]);

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

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
      .eq('creator_id', session.user.id); // Ensure only creator can delete

    if (error) {
      toast.error("Error deleting room: " + error.message);
      console.error("Error deleting room:", error);
    } else {
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      toast.success("Room deleted successfully.");
      addNotification(`You deleted the room: "${roomToDelete.name}".`);
    }
  }, [session, supabase, setRooms, addNotification]);

  return {
    handleCreateRoom,
    handleAddRoomMember,
    handleDeleteRoom,
  };
}