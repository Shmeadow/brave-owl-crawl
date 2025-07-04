"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  type: 'block' | 'mute';
  created_at: string;
  blocked_profile: {
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  }[] | null; // Changed to array
}

export function useBlockedUsers() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedUsers = useCallback(async () => {
    if (authLoading || !session?.user?.id || !supabase) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        id,
        blocker_id,
        blocked_id,
        type,
        created_at,
        blocked_profile:profiles!blocked_id ( first_name, last_name, profile_image_url )
      `)
      .eq('blocker_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching blocked users:", error);
      toast.error("Failed to load blocked users.");
      setBlockedUsers([]);
    } else {
      setBlockedUsers(data as BlockedUser[]);
    }
    setLoading(false);
  }, [authLoading, session, supabase]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const blockUser = useCallback(async (blockedId: string, type: 'block' | 'mute') => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to block/mute users.");
      return;
    }
    if (session.user.id === blockedId) {
      toast.error("You cannot block or mute yourself.");
      return;
    }

    // Check if already blocked/muted
    const existingBlock = blockedUsers.find(b => b.blocked_id === blockedId);
    if (existingBlock) {
      if (existingBlock.type === type) {
        toast.info(`This user is already ${type === 'block' ? 'blocked' : 'muted'}.`);
        return;
      } else {
        // Update existing block type
        const { error } = await supabase
          .from('blocked_users')
          .update({ type })
          .eq('id', existingBlock.id)
          .eq('blocker_id', session.user.id);

        if (error) {
          toast.error(`Failed to update block/mute status: ${error.message}`);
          console.error("Error updating block/mute status:", error);
        } else {
          toast.success(`User's status updated to ${type}.`);
          fetchBlockedUsers();
        }
        return;
      }
    }

    const { data, error } = await supabase
      .from('blocked_users')
      .insert({ blocker_id: session.user.id, blocked_id: blockedId, type })
      .select(`
        id,
        blocker_id,
        blocked_id,
        type,
        created_at,
        blocked_profile:profiles!blocked_id ( first_name, last_name, profile_image_url )
      `)
      .single();

    if (error) {
      toast.error(`Failed to ${type} user: ${error.message}`);
      console.error(`Error ${type}ing user:`, error);
    } else if (data) {
      setBlockedUsers(prev => [...prev, data as BlockedUser]);
      toast.success(`User ${type === 'block' ? 'blocked' : 'muted'} successfully.`);
    }
  }, [session, supabase, blockedUsers, fetchBlockedUsers]);

  const unblockUser = useCallback(async (blockedId: string) => {
    if (!session?.user?.id || !supabase) {
      toast.error("You must be logged in to unblock users.");
      return;
    }

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', session.user.id)
      .eq('blocked_id', blockedId);

    if (error) {
      toast.error(`Failed to unblock user: ${error.message}`);
      console.error("Error unblocking user:", error);
    } else {
      setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
      toast.success("User unblocked successfully.");
    }
  }, [session, supabase]);

  const isUserBlocked = useCallback((userId: string, type: 'block' | 'mute' | 'any' = 'any') => {
    if (type === 'any') {
      return blockedUsers.some(b => b.blocked_id === userId);
    }
    return blockedUsers.some(b => b.blocked_id === userId && b.type === type);
  }, [blockedUsers]);

  const isUserMuted = useCallback((userId: string) => {
    return isUserBlocked(userId, 'mute');
  }, [isUserBlocked]);

  return {
    blockedUsers,
    loading,
    fetchBlockedUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    isUserMuted,
  };
}