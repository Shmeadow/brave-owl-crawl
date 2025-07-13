"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";
import { getRandomBackground } from "@/lib/backgrounds";
import { useNotifications } from "@/hooks/use-notifications";

interface UseRoomManagementProps {
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  fetchRooms: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useRoomManagement({ setRooms, fetchRooms, refreshProfile }: UseRoomManagementProps) {
  const { supabase, session } = useSupabase();
  const { addNotification } = useNotifications();

  const handleCreateRoom = useCallback(async (name: string, type: 'public' | 'private', description: string | null) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to create a room.");
      return { data: null, error: { message: "Not logged in" } };
    }

    const nowIso = new Date().toISOString();
    const { data: existingRooms, error: existingRoomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('creator_id', session.user.id)
      .is('deleted_at', null)
      .gt('closes_at', nowIso);

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
    const closesAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        creator_id: session.user.id,
        name: name,
        background_url: randomBg.url,
        is_video_background: randomBg.isVideo,
        type: type,
        description: description,
        closes_at: closesAt,
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
      `)
      .single();

    if (error) {
      toast.error("Error creating room: " + error.message);
      console.error("Error creating room:", error);
      return { data: null, error };
    } else if (data) {
      const newRoom = { ...data, is_member: true } as RoomData;
      setRooms(prev => [...prev, newRoom]);

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ personal_room_id: data.id })
        .eq('id', session.user.id);

      if (profileUpdateError) {
        console.error("Error updating user's personal_room_id:", profileUpdateError);
        toast.error("Failed to link room to your profile.");
      } else {
        await refreshProfile();
      }

      addNotification(`You created a new room: "${data.name}".`);
      return { data: newRoom, error: null };
    }
    return { data: null, error: { message: "Unknown error creating room" } };
  }, [session, supabase, setRooms, addNotification, refreshProfile]);

  const handleUpdateRoomName = useCallback(async (roomId: string, newName: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to update room settings.");
      return { data: null, error: { message: "Not logged in" } };
    }
    if (!newName.trim()) {
      toast.error("Room name cannot be empty.");
      return { data: null, error: { message: "Room name cannot be empty" } };
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ name: newName.trim() })
      .eq('id', roomId)
      .eq('creator_id', session.user.id)
      .select()
      .single();

    if (error) {
      toast.error("Error updating room name: " + error.message);
      return { data: null, error };
    } else {
      toast.success(`Room name updated to "${newName}"!`);
      await fetchRooms();
      return { data, error: null };
    }
  }, [session, supabase, fetchRooms]);

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
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, type: newType, password_hash: newType === 'public' ? null : r.password_hash } : r));
      toast.success(`Room "${room.name}" is now ${newType}.`);
    }
  }, [session, supabase, setRooms]);

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
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, password_hash: password ? 'set' : null } : r));
        toast.success(password ? "Room password set successfully!" : "Room password removed successfully!");
      }
    } catch (error) {
      toast.error("Failed to set password due to network error.");
      console.error("Network error setting password:", error);
    }
  }, [session, supabase, setRooms]);

  const handleSendRoomInvitation = useCallback(async (roomId: string, receiverEmail: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to send invitations.");
      return;
    }

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

    toast.info(`An invitation email would be sent to ${receiverEmail} for the room "${room.name}". (This is a mock-up as direct user-to-user invites are complex).`);
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

    const { data, error } = await supabase
      .from('rooms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', roomId)
      .eq('creator_id', session.user.id)
      .select('id');

    if (error) {
      toast.error("Error deleting room: " + error.message);
      console.error("Error deleting room:", error);
    } else if (data) {
      toast.success("Room deleted successfully.");
      addNotification(`You deleted the room: "${roomToDelete.name}".`);
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  }, [session, supabase, addNotification, setRooms]);

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
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, description: newDescription } : r));
      toast.success(`Room "${room.name}" description updated!`);
    }
  }, [session, supabase, setRooms]);

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
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, background_url: backgroundUrl, is_video_background: isVideoBackground } : r));
      toast.success(`Room "${room.name}" background updated!`);
    }
  }, [session, supabase, setRooms]);

  return {
    handleCreateRoom,
    handleUpdateRoomName,
    handleUpdateRoomType,
    handleSetRoomPassword,
    handleSendRoomInvitation,
    handleDeleteRoom,
    handleUpdateRoomDescription,
    handleUpdateRoomBackground,
  };
}