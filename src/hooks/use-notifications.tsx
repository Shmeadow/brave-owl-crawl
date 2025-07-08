"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';

export interface NotificationData {
  id: string;
  user_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_notifications';

export function useNotifications() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

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
        localNotifications = [];
      }

      const { data: supabaseNotifications, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        toast.error("Error fetching notifications: " + fetchError.message);
        setNotifications([]);
      } else {
        let mergedNotifications = [...(supabaseNotifications as NotificationData[])];

        if (localNotifications.length > 0) {
          for (const localNotif of localNotifications) {
            const existsInSupabase = mergedNotifications.some(
              sn => sn.message === localNotif.message && new Date(sn.created_at).getTime() === new Date(localNotif.created_at).getTime()
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
                console.error("Error migrating local notification to Supabase:", insertError);
              } else if (newSupabaseNotif) {
                mergedNotifications.unshift(newSupabaseNotif as NotificationData);
              }
            }
          }
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          toast.success("Local notifications migrated!");
        }
        setNotifications(mergedNotifications);
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
      setNotifications(loadedNotifications);
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
    if (!supabase || !session?.user?.id) return;

    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          const newNotification = payload.new as NotificationData;
          setNotifications(prev => [newNotification, ...prev]);
          toast.info(newNotification.message, {
            description: "New notification!",
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session?.user?.id]);

  const addNotification = useCallback(async (message: string, targetUserId?: string) => {
    const userId = targetUserId || session?.user?.id;
    if (!userId) {
      if (!isLoggedInMode) {
        const newNotif: NotificationData = {
          id: crypto.randomUUID(),
          user_id: null,
          message,
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications(prev => [newNotif, ...prev]);
        toast.info(message);
      } else {
        toast.error("Cannot add notification: User not logged in or target user ID missing.");
      }
      return;
    }

    if (supabase) {
      await supabase
        .from('notifications')
        .insert({ user_id: userId, message, is_read: false });
    }
  }, [isLoggedInMode, session, supabase]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (isLoggedInMode && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (!error) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    }
  }, [isLoggedInMode, supabase]);

  const markAllAsRead = useCallback(async () => {
    if (isLoggedInMode && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session?.user?.id)
        .eq('is_read', false);
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  }, [isLoggedInMode, session, supabase]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (isLoggedInMode && supabase) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } else {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  }, [isLoggedInMode, supabase]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}