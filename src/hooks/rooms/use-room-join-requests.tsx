"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";
import { RoomData } from "./types";

export interface RoomJoinRequest {
  id: string;
  room_id: string;
  requester_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'dismissed';
  created_at: string;
  updated_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  } | null;
  rooms: {
    name: string;
    creator_id: string;
  } | null;
}

interface UseRoomJoinRequestsProps {
  rooms: RoomData[]; // Pass rooms to get room details
}

export function useRoomJoinRequests({ rooms }: UseRoomJoinRequestsProps) {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { addNotification } = useNotifications();
  const [pendingRequests, setPendingRequests] = useState<RoomJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (authLoading || !session?.user?.id || !supabase) {
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch requests where the current user is the creator of the room
    const { data, error } = await supabase
      .from('room_join_requests')
      .select(`
        id,
        room_id,
        requester_id,
        status,
        created_at,
        updated_at,
        profiles (first_name, last_name, profile_image_url),
        rooms (name, creator_id)
      `)
      .eq('status', 'pending')
      .in('room_id', rooms.filter(r => r.creator_id === session.user.id).map(r => r.id))
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching room join requests:", error);
      toast.error("Failed to load join requests.");
      setPendingRequests([]);
    } else {
      // Explicitly map to ensure types match, handling potential array return from Supabase join
      const mappedData: RoomJoinRequest[] = (data as any[]).map((item: any) => ({
        id: item.id,
        room_id: item.room_id,
        requester_id: item.requester_id,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // If Supabase returns an array of one element, take the first. Otherwise, it's already an object.
        profiles: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles,
        rooms: Array.isArray(item.rooms) ? item.rooms[0] || null : item.rooms,
      }));
      setPendingRequests(mappedData);
    }
    setLoading(false);
  }, [authLoading, session, supabase, rooms]);

  useEffect(() => {
    fetchRequests();

    if (!supabase || !session?.user?.id) return;

    // Subscribe to changes in the 'room_join_requests' table
    const channel = supabase
      .channel('public:room_join_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_join_requests' }, (payload) => {
        fetchRequests(); // Re-fetch requests on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests, supabase, session]);

  const updateRequestStatus = useCallback(async (requestId: string, newStatus: 'accepted' | 'declined' | 'dismissed') => {
    if (!supabase || !session?.user?.id) {
      toast.error("You must be logged in to manage join requests.");
      return;
    }

    const { error } = await supabase
      .from('room_join_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('status', 'pending'); // Only update if still pending

    if (error) {
      console.error(`Error updating request status to ${newStatus}:`, error);
      toast.error(`Failed to ${newStatus} request: ${error.message}`);
      return false;
    }
    toast.success(`Request ${newStatus} successfully.`);
    fetchRequests(); // Re-fetch to update UI
    return true;
  }, [supabase, session, fetchRequests]);

  const acceptRequest = useCallback(async (request: RoomJoinRequest) => {
    if (!supabase || !session?.user?.id) {
      toast.error("You must be logged in to accept join requests.");
      return;
    }

    // 1. Add member to room_members table
    const { error: memberError } = await supabase
      .from('room_members')
      .insert({ room_id: request.room_id, user_id: request.requester_id });

    if (memberError) {
      console.error("Error adding room member:", memberError);
      toast.error("Failed to add user to room: " + memberError.message);
      return;
    }

    // 2. Update request status
    const success = await updateRequestStatus(request.id, 'accepted');
    if (success) {
      const requesterName = request.profiles?.first_name || request.profiles?.last_name || `User (${request.requester_id.substring(0, 8)}...)`;
      const roomName = request.rooms?.name || request.room_id.substring(0, 8) + '...';
      addNotification(`Your request to join "${roomName}" was accepted!`, request.requester_id);
      addNotification(`${requesterName} joined "${roomName}".`);
    }
  }, [supabase, session, updateRequestStatus, addNotification]);

  const declineRequest = useCallback(async (request: RoomJoinRequest) => {
    const success = await updateRequestStatus(request.id, 'declined');
    if (success) {
      const roomName = request.rooms?.name || request.room_id.substring(0, 8) + '...';
      addNotification(`Your request to join "${roomName}" was declined.`, request.requester_id);
    }
  }, [updateRequestStatus, addNotification]);

  const dismissRequest = useCallback(async (request: RoomJoinRequest) => {
    const success = await updateRequestStatus(request.id, 'dismissed');
    if (success) {
      const requesterName = request.profiles?.first_name || request.profiles?.last_name || `User (${request.requester_id.substring(0, 8)}...)`;
      const roomName = request.rooms?.name || request.room_id.substring(0, 8) + '...';
      addNotification(`${requesterName} requested to join "${roomName}". (Dismissed)`, session?.user?.id); // Add to owner's notification bell
    }
  }, [updateRequestStatus, addNotification, session]);

  return {
    pendingRequests,
    loading,
    acceptRequest,
    declineRequest,
    dismissRequest,
    fetchRequests,
  };
}