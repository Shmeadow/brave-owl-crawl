"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface RoomData {
  id: string;
  creator_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
}

export function useRooms() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (authLoading || !supabase) return;

    setLoading(true);
    // Fetch all public rooms AND rooms created by the current user
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .or(`is_public.eq.true,creator_id.eq.${session?.user?.id || 'null'}`)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Error fetching rooms: " + error.message);
      console.error("Error fetching rooms:", error);
      setRooms([]);
    } else {
      setRooms(data as RoomData[]);
    }
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
        is_public: isPublic, // Default to private as per request
      })
      .select()
      .single();

    if (error) {
      toast.error("Error creating room: " + error.message);
      console.error("Error creating room:", error);
    } else if (data) {
      setRooms((prevRooms) => [...prevRooms, data as RoomData]);
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

  const handleDeleteRoom = useCallback(async (roomId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to delete a room.");
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
    }
  }, [session, supabase]);

  return {
    rooms,
    loading,
    handleCreateRoom,
    handleToggleRoomPublicStatus,
    handleDeleteRoom,
    fetchRooms, // Expose fetch for re-fetching if needed
  };
}