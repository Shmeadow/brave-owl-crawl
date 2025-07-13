"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { RoomData } from "./types";
import { getRandomBackground } from "@/lib/backgrounds";
import { useNotifications } from "@/hooks/use-notifications";

interface UseRoomManagementProps {
  rooms: RoomData[];
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  fetchRooms: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useRoomManagement({ rooms, setRooms, fetchRooms, refreshProfile }: UseRoomManagementProps) {
  const { supabase, session, profile } = useSupabase();
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
    const tempId = `temp-${crypto.randomUUID()}`;
    const newRoomOptimistic: RoomData = {
        id: tempId,
        creator_id: session.user.id,
        name,
        type,
        description,
        created_at: new Date().toISOString(),
        closes_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        background_url: randomBg.url,
        is_video_background: randomBg.isVideo,
        is_member: true,
        password_hash: null,
        deleted_at: null,
        profiles: [{ first_name: profile?.first_name || 'You', last_name: profile?.last_name || '' }]
    };

    // Optimistic update
    setRooms(prev => [...prev, newRoomOptimistic]);

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
      // Revert optimistic update on error
      setRooms(prev => prev.filter(r => r.id !== tempId));
      return { data: null, error };
    } else if (data) {
      const finalRoom = { ...data, is_member: true } as RoomData;
      // Replace temp room with real one from DB
      setRooms(prev => prev.map(r => r.id === tempId ? finalRoom : r));

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
      return { data: finalRoom, error: null };
    }
    return { data: null, error: { message: "Unknown error creating room" } };
  }, [session, supabase, setRooms, addNotification, refreshProfile, profile]);

  const handleUpdateRoomName = useCallback(async (roomId: string, newName: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to update room settings.");
      return { data: null, error: { message: "Not logged in" } };
    }
    if (!newName.trim()) {
      toast.error("Room name cannot be empty.");
      return { data: null, error: { message: "Room name cannot be empty" } };
    }

    const originalRooms = [...rooms];
    const updatedRooms = rooms.map(r => r.id === roomId ? { ...r, name: newName.trim() } : r);
    setRooms(updatedRooms); // Optimistic update

    const { data, error } = await supabase
      .from('rooms')
      .update({ name: newName.trim() })
      .eq('id', roomId)
      .eq('creator_id', session.user.id)
      .select()
      .single();

    if (error) {
      toast.error("Error updating room name: " + error.message);
      setRooms(originalRooms); // Revert on error
      return { data: null, error };
    } else {
      toast.success(`Room name updated to "${newName}"!`);
      return { data, error: null };
    }
  }, [session, supabase, rooms, setRooms]);

  const handleUpdateRoomType = useCallback(async (roomId: string, newType: 'public' | 'private') => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to update room settings.");
      return;
    }

    const originalRooms = [...rooms];
    const roomToUpdate = originalRooms.find(r => r.id === roomId);
    if (!roomToUpdate) return;

    if (roomToUpdate.creator_id !== session.user.id) {
      toast.error("You can only change the type of rooms you created.");
      return;
    }

    // Optimistic update
    const updatedRooms = rooms.map(r => r.id === roomId ? { ...r, type: newType, password_hash: newType === 'public' ? null : r.password_hash } : r);
    setRooms(updatedRooms);

    let updateData: { type: 'public' | 'private'; password_hash?: string | null } = { type: newType };
    if (newType === 'public' && roomToUpdate.password_hash) {
      updateData.password_hash = null;
    }

    const { error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', roomId)
      .eq('creator_id', session.user.id);

    if (error) {
      toast.error("Error updating room type: " + error.message);
      setRooms(originalRooms); // Revert on error
    } else {
      toast.success(`Room "${roomToUpdate.name}" is now ${newType}.`);
    }
  }, [session, supabase, rooms, setRooms]);

  const handleSetRoomPassword = useCallback(async (roomId: string, password: string | null) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to set a room password.");
      return;
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      toast.error("Room not found.");
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
      } else {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, password_hash: password ? 'set' : null } : r));
        toast.success(password ? "Room password set successfully!" : "Room password removed successfully!");
      }
    } catch (error) {
      toast.error("Failed to set password due to network error.");
    }
  }, [session, supabase, rooms, setRooms]);

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

    const originalRooms = [...rooms];
    const roomToDelete = originalRooms.find(r => r.id === roomId);

    if (!roomToDelete) {
      toast.error("Room not found.");
      return;
    }

    if (roomToDelete.creator_id !== session.user.id) {
      toast.error("You can only delete rooms you created.");
      return;
    }

    // Optimistic update
    setRooms(prev => prev.filter(r => r.id !== roomId));

    const { error } = await supabase
      .from('rooms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', roomId)
      .eq('creator_id', session.user.id);

    if (error) {
      toast.error("Error deleting room: " + error.message);
      setRooms(originalRooms); // Revert on error
    } else {
      toast.success("Room deleted successfully.");
      addNotification(`You deleted the room: "${roomToDelete.name}".`);
    }
  }, [session, supabase, addNotification, setRooms, rooms]);

  const handleUpdateRoomDescription = useCallback(async (roomId: string, newDescription: string | null) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to update room settings.");
      return;
    }

    const originalRooms = [...rooms];
    const roomToUpdate = originalRooms.find(r => r.id === roomId);
    if (!roomToUpdate) return;

    if (roomToUpdate.creator_id !== session.user.id) {
      toast.error("You can only change the description of rooms you created.");
      return;
    }

    // Optimistic update
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, description: newDescription } : r));

    const { error } = await supabase
      .from('rooms')
      .update({ description: newDescription })
      .eq('id', roomId)
      .eq('creator_id', session.user.id);

    if (error) {
      toast.error("Error updating room description: " + error.message);
      setRooms(originalRooms); // Revert on error
    } else {
      toast.success(`Room "${roomToUpdate.name}" description updated!`);
    }
  }, [session, supabase, rooms, setRooms]);

  const handleUpdateRoomBackground = useCallback(async (roomId: string, backgroundUrl: string, isVideoBackground: boolean) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to update room settings.");
      return;
    }

    const originalRooms = [...rooms];
    const roomToUpdate = originalRooms.find(r => r.id === roomId);
    if (!roomToUpdate) return;

    if (roomToUpdate.creator_id !== session.user.id) {
      toast.error("You can only change the background of rooms you created.");
      return;
    }

    // Optimistic update
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, background_url: backgroundUrl, is_video_background: isVideoBackground } : r));

    const { error } = await supabase
      .from('rooms')
      .update({ background_url: backgroundUrl, is_video_background: isVideoBackground })
      .eq('id', roomId)
      .eq('creator_id', session.user.id);

    if (error) {
      toast.error("Error updating room background: " + error.message);
      setRooms(originalRooms); // Revert on error
    } else {
      toast.success(`Room "${roomToUpdate.name}" background updated!`);
    }
  }, [session, supabase, rooms, setRooms]);

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