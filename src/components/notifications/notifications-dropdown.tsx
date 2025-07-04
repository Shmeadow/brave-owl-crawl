"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, VolumeX, Ban, Loader2, MessageSquare, Bell } from "lucide-react"; // Added Bell
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useRooms } from "@/hooks/use-rooms";
import { useBlockedUsers } from "@/hooks/use-blocked-users"; // New hook for blocked users
import { cn } from "@/lib/utils";

interface RoomJoinRequest {
  id: string;
  room_id: string;
  requester_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  rooms: {
    name: string;
    creator_id: string;
  }[] | null; // Changed to array
  profiles: {
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  }[] | null; // Changed to array
}

interface NotificationsDropdownProps {
  unreadCount: number;
  onClearUnread: () => void;
  onNewUnread: () => void;
}

export function NotificationsDropdown({ unreadCount, onClearUnread, onNewUnread }: NotificationsDropdownProps) {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const { fetchRooms } = useRooms(); // To refresh room list after accepting a join request
  const { blockUser, unblockUser, isUserBlocked, isUserMuted } = useBlockedUsers(); // Use new blocked users hook
  const [pendingRequests, setPendingRequests] = useState<RoomJoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const fetchPendingRequests = useCallback(async () => {
    if (authLoading || !session?.user?.id || !supabase) {
      setLoadingRequests(false);
      return;
    }

    setLoadingRequests(true);
    const { data, error } = await supabase
      .from('room_join_requests')
      .select(`
        id,
        room_id,
        requester_id,
        status,
        created_at,
        rooms ( name, creator_id ),
        profiles ( first_name, last_name, profile_image_url )
      `)
      .eq('status', 'pending')
      .eq('rooms.creator_id', session.user.id) // Only requests for rooms created by current user
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching pending join requests:", error);
      toast.error("Failed to load join requests.");
      setPendingRequests([]);
    } else {
      const newRequests = data as RoomJoinRequest[];
      const previousRequestIds = new Set(pendingRequests.map(req => req.id));
      const newlyArrivedRequests = newRequests.filter(req => !previousRequestIds.has(req.id));

      setPendingRequests(newRequests);
      if (newlyArrivedRequests.length > 0) {
        onNewUnread();
      }
    }
    setLoadingRequests(false);
  }, [authLoading, session, supabase, onNewUnread, pendingRequests]);

  useEffect(() => {
    fetchPendingRequests();

    if (supabase && session?.user?.id) {
      const channelName = `room_join_requests_owner_${session.user.id}`;
      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'room_join_requests',
          filter: `rooms.creator_id=eq.${session.user.id}` // This filter might not work directly on RLS, rely on RLS for security
        }, (payload) => {
          const newRequest = payload.new as RoomJoinRequest;
          // Re-fetch all requests to ensure consistency and apply RLS
          fetchPendingRequests();
          toast.info(`New join request for "${newRequest.rooms?.[0]?.name}" from ${newRequest.profiles?.[0]?.first_name || 'A user'}!`);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [supabase, session, fetchPendingRequests]);

  const handleAction = useCallback(async (requestId: string, action: 'accept' | 'reject' | 'mute' | 'block') => {
    if (!supabase || !session?.user?.id) {
      toast.error("You must be logged in to perform this action.");
      return;
    }

    setProcessingRequestId(requestId);
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) {
      toast.error("Request not found.");
      setProcessingRequestId(null);
      return;
    }

    try {
      if (action === 'accept') {
        // Add user to room_members
        const { error: memberError } = await supabase
          .from('room_members')
          .insert({ room_id: request.room_id, user_id: request.requester_id });

        if (memberError) {
          toast.error("Failed to add user to room: " + memberError.message);
          console.error("Error adding room member:", memberError);
          setProcessingRequestId(null);
          return;
        }
        toast.success(`Accepted ${request.profiles?.[0]?.first_name || 'user'} into "${request.rooms?.[0]?.name}".`);
        fetchRooms(); // Refresh user's room list to show new member
      } else if (action === 'mute') {
        await blockUser(request.requester_id, 'mute');
        toast.info(`Muted requests from ${request.profiles?.[0]?.first_name || 'user'}.`);
      } else if (action === 'block') {
        await blockUser(request.requester_id, 'block');
        toast.warning(`Blocked ${request.profiles?.[0]?.first_name || 'user'}.`);
      }

      // Update request status in DB
      const { error: updateError } = await supabase
        .from('room_join_requests')
        .update({ status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : action === 'mute' ? 'muted' : 'blocked' })
        .eq('id', requestId);

      if (updateError) {
        toast.error("Failed to update request status: " + updateError.message);
        console.error("Error updating request status:", updateError);
      } else {
        // Remove the request from local state
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        if (unreadCount > 0) onClearUnread(); // Clear unread count if all are handled
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred: " + error.message);
      console.error("Unexpected error during notification action:", error);
    } finally {
      setProcessingRequestId(null);
    }
  }, [supabase, session, pendingRequests, fetchRooms, unreadCount, onClearUnread, blockUser]);

  const getRequesterName = (req: RoomJoinRequest) => {
    return req.profiles?.[0]?.first_name || req.profiles?.[0]?.last_name || `User (${req.requester_id.substring(0, 8)}...)`;
  };

  return (
    <DropdownMenu onOpenChange={(open) => !open && onClearUnread()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Notifications" className="relative">
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 z-[1003] bg-popover/80 backdrop-blur-lg" align="end" forceMount>
        <DropdownMenuLabel className="font-bold">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-72">
          <div className="p-2">
            {loadingRequests ? (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No new notifications.</p>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="flex flex-col p-3 mb-2 border rounded-md bg-muted/50">
                  <p className="text-sm font-medium">
                    <span className="text-primary">{getRequesterName(request)}</span> wants to join your room{" "}
                    <span className="font-bold">{request.rooms?.[0]?.name || 'Unknown Room'}</span>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => handleAction(request.id, 'accept')}
                      disabled={processingRequestId === request.id || isUserBlocked(request.requester_id, 'block')}
                    >
                      {processingRequestId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => handleAction(request.id, 'reject')}
                      disabled={processingRequestId === request.id}
                    >
                      {processingRequestId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-7 px-3", isUserMuted(request.requester_id) ? "text-muted-foreground" : "")}
                      onClick={() => handleAction(request.id, 'mute')}
                      disabled={processingRequestId === request.id || isUserBlocked(request.requester_id, 'block')}
                      title={isUserMuted(request.requester_id) ? "Already muted" : "Mute future requests from this user"}
                    >
                      {processingRequestId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <VolumeX className="mr-1 h-4 w-4" />}
                      Mute
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className={cn("h-7 px-3", isUserBlocked(request.requester_id, 'block') ? "opacity-50 cursor-not-allowed" : "")}
                      onClick={() => handleAction(request.id, 'block')}
                      disabled={processingRequestId === request.id || isUserBlocked(request.requester_id, 'block')}
                      title={isUserBlocked(request.requester_id, 'block') ? "Already blocked" : "Block this user from sending requests"}
                    >
                      {processingRequestId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-1 h-4 w-4" />}
                      Block
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm text-muted-foreground" onClick={() => toast.info("More notification options coming soon!")}>
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}