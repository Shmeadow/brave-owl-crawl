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
  rooms: { name: string } | null;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
}

const LOCAL_STORAGE_KEY = 'guest_notifications';

export function useNotifications() {
  const { supabase, session, loading: authLoading, profile } = useSupabase();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [roomInvitations, setRoomInvitations] = useState<RoomInvitationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

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
      } else if (data && userId === session?.user?.id) {
        setNotifications(prev => [data as NotificationData, ...prev]);
      }
    } else if (!isLoggedInMode && !targetUserId) {
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
      const localNotificationsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localNotifications: NotificationData[] = [];
      try {
        localNotifications = localNotificationsString ? JSON.parse(localNotificationsString) : [];
      } catch (e) {
        console.error("Error parsing local storage notifications:", e);
      }

      const { data: supabaseNotifications, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        toast.error("Error fetching notifications: " + fetchError.message);
      } else {
        let mergedNotifications = [...(supabaseNotifications as NotificationData[])];
        if (localNotifications.length > 0) {
          // Migration logic here...
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        mergedNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setNotifications(mergedNotifications);
      }

      // Fetch room invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('room_invitations')
        .select('id, room_id, sender_id, receiver_id, status, created_at')
        .eq('receiver_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error("Error fetching room invitations:", invitationsError);
        setRoomInvitations([]);
      } else if (invitations) {
        const senderIds = [...new Set(invitations.map(inv => inv.sender_id))];
        const roomIds = [...new Set(invitations.map(inv => inv.room_id))];

        let profilesMap = new Map();
        if (senderIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', senderIds);
          if (profilesError) console.error("Error fetching sender profiles:", profilesError);
          else if (profilesData) profilesMap = new Map(profilesData.map(p => [p.id, p]));
        }

        let roomsMap = new Map();
        if (roomIds.length > 0) {
          const { data: roomsData, error: roomsError } = await supabase
            .from('rooms')
            .select('id, name')
            .in('id', roomIds);
          if (roomsError) console.error("Error fetching room names for invitations:", roomsError);
          else if (roomsData) roomsMap = new Map(roomsData.map(r => [r.id, r]));
        }

        const enrichedInvitations = invitations.map(inv => ({
          ...inv,
          profiles: profilesMap.get(inv.sender_id) || null,
          rooms: roomsMap.get(inv.room_id) || null,
        }));
        setRoomInvitations(enrichedInvitations as RoomInvitationData[]);
      }

    } else {
      setIsLoggedInMode(false);
      const storedNotificationsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedNotifications: NotificationData[] = [];
      try {
        loadedNotifications = storedNotificationsString ? JSON.parse(storedNotificationsString) : [];
      } catch (e) {
        console.error("Error parsing local storage notifications:", e);
      }
      setNotifications(loadedNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setRoomInvitations([]);
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

  useEffect(() => {
    if (!loading && session && profile && !profile.welcome_notification_sent) {
      addNotification("Welcome to CozyHub! Explore your new workspace.");
      supabase?.from('profiles')
        .update({ welcome_notification_sent: true })
        .eq('id', profile.id)
        .then(({ error }) => {
          if (error) console.error("Error updating welcome_notification_sent:", error);
        });
    }
  }, [loading, session, profile, addNotification, supabase]);

  useEffect(() => {
    if (!supabase || !session?.user?.id) return;

    const channel = supabase
      .channel(`room_invitations_for_${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_invitations', filter: `receiver_id=eq.${session.user.id}` }, 
      (payload) => {
        fetchNotifications(); // Refetch all notifications and invitations on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session, fetchNotifications]);

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
    roomInvitations,
    loading,
    isLoggedInMode,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteReadNotifications,
    handleDeleteNotification,
    fetchNotifications,
  };
}