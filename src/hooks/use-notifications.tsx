"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { usePersistentData } from "./use-persistent-data"; // Import the new hook

export interface NotificationData {
  id: string;
  user_id: string | null; // Null for guest notifications
  message: string;
  is_read: boolean;
  created_at: string;
}

interface DbNotification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_notifications';
const SUPABASE_TABLE_NAME = 'notifications';

export function useNotifications() {
  const { supabase, session, profile } = useSupabase();

  const {
    data: notifications,
    loading,
    isLoggedInMode,
    setData: setNotifications,
    fetchData,
  } = usePersistentData<NotificationData[], DbNotification>({ // T_APP_DATA is NotificationData[], T_DB_DATA_ITEM is DbNotification
    localStorageKey: LOCAL_STORAGE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: [],
    selectQuery: '*',
    transformFromDb: (dbNotifications: DbNotification[]) => dbNotifications.map(notif => ({
      id: notif.id,
      user_id: notif.user_id,
      message: notif.message,
      is_read: notif.is_read,
      created_at: notif.created_at,
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), // Ensure sorting
    transformToDb: (appNotif: NotificationData, userId: string) => ({ // appItem is NotificationData, returns DbNotification
      id: appNotif.id,
      user_id: userId,
      message: appNotif.message,
      is_read: appNotif.is_read,
      created_at: appNotif.created_at,
    }),
    userIdColumn: 'user_id',
    onConflictColumn: 'id',
    debounceDelay: 0,
  });

  // Logic for one-time welcome notification
  useEffect(() => {
    if (!loading && session && profile && !profile.welcome_notification_sent) {
      addNotification("Welcome to Productivity Hub! Explore your new workspace.");
      // Mark notification as sent in profile
      supabase?.from('profiles')
        .update({ welcome_notification_sent: true })
        .eq('id', profile.id)
        .then(({ error }) => {
          if (error) console.error("Error updating welcome_notification_sent:", error);
        });
    }
  }, [loading, session, profile, supabase]); // Removed addNotification from dependencies to prevent infinite loop

  const addNotification = useCallback(async (message: string, targetUserId?: string) => {
    const userId = targetUserId || session?.user?.id || null;

    if (isLoggedInMode && supabase && userId) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .insert({ user_id: userId, message, is_read: false })
        .select()
        .single();
      if (error) {
        toast.error("Error adding notification: " + error.message);
        console.error("Error adding notification (Supabase):", error);
      } else if (data && userId === session?.user?.id) { // Only add to current state if it's for the current user
        fetchData(); // Re-fetch to ensure state is consistent
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
  }, [isLoggedInMode, session, supabase, setNotifications, fetchData]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const notificationToUpdate = notifications.find(n => n.id === notificationId);
    if (!notificationToUpdate || notificationToUpdate.is_read) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)
        .select()
        .single();
      if (error) {
        toast.error("Error marking notification as read: " + error.message);
        console.error("Error marking notification as read (Supabase):", error);
      } else if (data) {
        fetchData();
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    }
  }, [notifications, isLoggedInMode, session, supabase, setNotifications, fetchData]);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .update({ is_read: true })
        .in('id', unreadNotifications.map(n => n.id))
        .eq('user_id', session.user.id);
      if (error) {
        toast.error("Error marking all notifications as read: " + error.message);
        console.error("Error marking all notifications as read (Supabase):", error);
      } else {
        fetchData();
        toast.success("All notifications marked as read.");
      }
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read (locally).");
    }
  }, [notifications, isLoggedInMode, session, supabase, setNotifications, fetchData]);

  const deleteReadNotifications = useCallback(async () => {
    const readNotifications = notifications.filter(n => n.is_read);
    if (readNotifications.length === 0) {
        toast.info("No read notifications to delete.");
        return;
    }

    const readNotificationIds = readNotifications.map(n => n.id);

    if (isLoggedInMode && session && supabase) {
        const { error } = await supabase
            .from(SUPABASE_TABLE_NAME)
            .delete()
            .in('id', readNotificationIds)
            .eq('user_id', session.user.id);

        if (error) {
            toast.error("Error deleting read notifications: " + error.message);
            console.error("Error deleting read notifications (Supabase):", error);
        } else {
            fetchData();
            toast.success("Read notifications cleared.");
        }
    } else {
        setNotifications(prev => prev.filter(n => !n.is_read));
        toast.success("Read notifications cleared (locally).");
    }
  }, [notifications, isLoggedInMode, session, supabase, setNotifications, fetchData]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    isLoggedInMode,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteReadNotifications,
    fetchNotifications: fetchData,
  };
}