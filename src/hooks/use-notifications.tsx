"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface NotificationData {
  id: string;
  user_id: string | null; // Null for guest notifications
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface RoomInvitationData {
  id: string;
  room_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  rooms: { name: string } | null; // This will be null from the initial fetch now
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null; // Joined to get sender name and email
}

const LOCAL_STORAGE_KEY = 'guest_notifications';

export function useNotifications() {
  const { supabase, session, loading: authLoading, profile } = useSupabase(); // Get profile here
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [roomInvitations, setRoomInvitations] = useState<RoomInvitationData[]>([]); // New state for invitations
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0); // New state for unread count
  const [isLoggedInMode, setIsLoggedInMode] = useState(false); // Declare isLoggedInMode here

  // Moved addNotification declaration here to fix TS2448/TS2454
  const addNotification = useCallback(async (message: string, targetUserId?: string) => {
    const userId = targetUserId || session?.user?.id || null;

    if (isLoggedInMode && supabase && userId) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({ user_id: userId, message, is_read: false })
        .select()
        .single();
      if (error) {
        toast.error("Error adding notification: " + error.message);
        console.error("Error adding notification (Supabase):", error);
      } else if (data && userId === session?.user?.id) { // Only add to current state if it's for the current user
        setNotifications(prev => [data as NotificationData, ...prev]);
      }
    } else if (!isLoggedInMode && !targetUserId) { // Only add to local storage if guest and no specific target
      const newNotification: NotificationData = {
        id: crypto.randomUUID(),
        user_id: null,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  }, [isLoggedInMode, session, supabase]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      // Attempt to migrate local notifications first
      const localNotificationsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localNotifications: NotificationData[] = [];
      try {
        localNotifications = localNotificationsString ? JSON.parse(localNotificationsString) : [];
      } catch (e) {
        console.error("Error parsing local storage notifications:", e);
        localNotifications = [];
      }

      const { data: supabaseNotifications, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }); // Order by newest first

      if (fetchError) {
        toast.error("Error fetching notifications: " + fetchError.message);
        console.error("Error fetching notifications (Supabase):", fetchError);
        setNotifications([]);
      } else {
        let mergedNotifications = [...(supabaseNotifications as NotificationData[])];

        if (localNotifications.length > 0) {
          for (const localNotif of localNotifications) {
            const existsInSupabase = mergedNotifications.some(
              sn => sn.message === localNotif.message && sn.created_at === localNotif.created_at
            );
            if (!existsInSupabase) {
              const { data: newSupabaseNotif, error: insertError } = await supabase
                .from('notifications')
                .insert({
                  user_id: session.user.id,
                  message: localNotif.message,
                  is_read: localNotif.is_read,
                  created_at: localNotif.created_at || new Date().toISOString(),
                })
                .select()
                .single();
              if (insertError) {
                console.error("Error migrating local notification:", insertError);
              } else if (newSupabaseNotif) {
                mergedNotifications.push(newSupabaseNotif as NotificationData);
              }
            }
          }
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          toast.success("Local notifications migrated!");
        }
        // Sort again after merging to ensure correct order
        mergedNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setNotifications(mergedNotifications);
      }

      // Fetch room invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('room_invitations')
        .select(`
          id,
          room_id,
          sender_id,
          receiver_id,
          status,
          created_at,
          profiles:sender_id (first_name, last_name, email)
        `)
        .eq('receiver_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error("Error fetching room invitations:", invitationsError);
        setRoomInvitations([]);
      } else {
        // Explicitly map to ensure correct types for nested objects
        setRoomInvitations(invitations.map((inv: any) => ({
          id: inv.id,
          room_id: inv.room_id,
          sender_id: inv.sender_id,
          receiver_id: inv.receiver_id,
          status: inv.status,
          created_at: inv.created_at,
          rooms: null, // Set to null as we are not fetching it anymore
          profiles: inv.profiles ? { first_name: inv.profiles.first_name, last_name: inv.profiles.last_name, email: inv.profiles.email } : null,
        })) as RoomInvitationData[]);
      }

    } else {
      setIsLoggedInMode(false);
      const storedNotificationsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedNotifications: NotificationData[] = [];
      try {
        loadedNotifications = storedNotificationsString ? JSON.parse(storedNotificationsString) : [];
      } catch (e) {
        console.error("Error parsing local storage notifications:", e);
        loadedNotifications = [];
      }
      setNotifications(loadedNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setRoomInvitations([]); // No invitations for guests
    }
    setLoading(false);
  }, [session, supabase, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchNotifications();
    }
  }, [authLoading, fetchNotifications]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications, isLoggedInMode, loading]);

  // Logic for one-time welcome notification
  useEffect(() => {
    if (!loading && session && profile && !profile.welcome_notification_sent) {
      addNotification("Welcome to CozyHub! Explore your new workspace.");
      // Mark notification as sent in profile
      supabase?.from('profiles')
        .update({ welcome_notification_sent: true })
        .eq('id', profile.id)
        .then(({ error }) => {
          if (error) console.error("Error updating welcome_notification_sent:", error);
        });
    }
  }, [loading, session, profile, addNotification, supabase]);

  // Realtime subscription for new room invitations
  useEffect(() => {
    if (!supabase || !session?.user?.id) return;

    const channel = supabase
      .channel(`room_invitations_for_${session.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_invitations',
        filter: `receiver_id=eq.${session.user.id}`
      }, async (payload) => {
        const newInvitation = payload.new as RoomInvitationData;
        // Fetch room name and sender profile for the new invitation
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('name')
          .eq('id', newInvitation.room_id)
          .single();
        const { data: senderProfileData, error: senderProfileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', newInvitation.sender_id)
          .single();

        if (roomError) console.error("Error fetching room for new invitation:", roomError);
        if (senderProfileError) console.error("Error fetching sender profile for new invitation:", senderProfileError);

        const senderName = senderProfileData ? `${senderProfileData.first_name || ''} ${senderProfileData.last_name || ''}`.trim() || senderProfileData.email || `User (${newInvitation.sender_id.substring(0, 8)}...)` : `User (${newInvitation.sender_id.substring(0, 8)}...)`;
        const roomName = roomData?.name || `Room (${newInvitation.room_id.substring(0, 8)}...)`;

        setRoomInvitations(prev => [{
          ...newInvitation,
          rooms: roomData,
          profiles: senderProfileData,
        }, ...prev]);
        addNotification(`You have a new invitation from ${senderName} to join "${roomName}".`);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'room_invitations',
        filter: `receiver_id=eq.${session.user.id}`
      }, (payload) => {
        const updatedInvitation = payload.new as RoomInvitationData;
        if (updatedInvitation.status !== 'pending') {
          // Remove non-pending invitations from the list
          setRoomInvitations(prev => prev.filter(inv => inv.id !== updatedInvitation.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session, addNotification]);

  // Update unread count whenever notifications or invitations change
  useEffect(() => {
    const newUnreadCount = notifications.filter(n => !n.is_read).length + roomInvitations.length;
    setUnreadCount(newUnreadCount);
  }, [notifications, roomInvitations]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const notificationToUpdate = notifications.find(n => n.id === notificationId);
    if (!notificationToUpdate || notificationToUpdate.is_read) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)
        .select()
        .single();
      if (error) {
        toast.error("Error marking notification as read: " + error.message);
        console.error("Error marking notification as read (Supabase):", error);
      } else if (data) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? data as NotificationData : n));
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    }
  }, [notifications, isLoggedInMode, session, supabase]);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadNotifications.map(n => n.id))
        .eq('user_id', session.user.id);
      if (error) {
        toast.error("Error marking all notifications as read: " + error.message);
        console.error("Error marking all notifications as read (Supabase):", error);
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        toast.success("All notifications marked as read.");
      }
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read (locally).");
    }
  }, [notifications, isLoggedInMode, session, supabase]);

  const deleteReadNotifications = useCallback(async () => {
    const readNotifications = notifications.filter(n => n.is_read);
    if (readNotifications.length === 0) {
        toast.info("No read notifications to delete.");
        return;
    }

    const readNotificationIds = readNotifications.map(n => n.id);

    if (isLoggedInMode && session && supabase) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .in('id', readNotificationIds)
            .eq('user_id', session.user.id);

        if (error) {
            toast.error("Error deleting read notifications: " + error.message);
            console.error("Error deleting read notifications (Supabase):", error);
        } else {
            setNotifications(prev => prev.filter(n => !n.is_read));
            toast.success("Read notifications cleared.");
        }
    } else {
        setNotifications(prev => prev.filter(n => !n.is_read));
        toast.success("Read notifications cleared (locally).");
    }
  }, [notifications, isLoggedInMode, session, supabase]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', session.user.id);
      if (error) {
        toast.error("Error deleting notification: " + error.message);
        console.error("Error deleting notification (Supabase):", error);
      } else {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success("Notification deleted.");
      }
    } else {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success("Notification deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  return {
    notifications,
    roomInvitations, // Expose room invitations
    loading,
    isLoggedInMode,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteReadNotifications,
    handleDeleteNotification, // Expose new function
    fetchNotifications, // Expose for manual refresh
  };
}