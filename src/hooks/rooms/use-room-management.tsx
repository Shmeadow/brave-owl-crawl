"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";

interface UseRoomManagementProps {
  fetchRooms: () => Promise<void>;
}

export function useRoomManagement({ fetchRooms }: UseRoomManagementProps) {
  const { supabase, session } = useSupabase();
  const { addNotification } = useNotifications();

  const handleCreateRoom = useCallback(async (name: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to create a room.");
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({ creator_id: session.user.id, name })
      .select()
      .single();

    if (error) {
      toast.error("Error creating room: " + error.message);
      console.error("Error creating room:", error);
    } else {
      toast.success(`Room "${data.name}" created successfully!`);
      await fetchRooms();
    }
  }, [session, supabase, fetchRooms]);

  const handleAddRoomMember = useCallback(async (roomId: string, userIdToAdd: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to add members.");
      return;
    }

    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: userIdToAdd });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast.error("This user is already a member of the room.");
      } else {
        toast.error("Error adding member: " + error.message);
        console.error("Error adding member:", error);
      }
    } else {
      toast.success("Member added successfully!");
      await addNotification("You've been added to a new room!", userIdToAdd);
      await fetchRooms();
    }
  }, [session, supabase, fetchRooms, addNotification]);

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to delete a room.");
      return;
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
      .eq('creator_id', session.user.id);

    if (error) {
      toast.error("Error deleting room: " + error.message);
      console.error("Error deleting room:", error);
    } else {
      toast.success("Room deleted successfully.");
      await fetchRooms();
    }
  }, [session, supabase, fetchRooms]);

  return {
    handleCreateRoom,
    handleAddRoomMember,
    handleDeleteRoom,
  };
}