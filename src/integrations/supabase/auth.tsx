"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from './client';
import { toast } from 'sonner';
import { useNotification } from '@/hooks/use-notification';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: string | null;
  time_format_24h: boolean | null;
  welcome_notification_sent: boolean | null;
  personal_room_id: string | null;
}

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SessionContextProvider({ children }: { children: React.ReactNode }) {
  const { addNotification } = useNotification();
  
  const supabaseClient = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createBrowserClient(addNotification);
    }
    return null;
  }, [addNotification]);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const internalFetchProfile = useCallback(async (userId: string, client: SupabaseClient) => {
    const { data, error } = await client
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, role, time_format_24h, welcome_notification_sent, personal_room_id')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching user profile:", error);
      setProfile(null);
    } else if (data) {
      setProfile(data as UserProfile);
    } else {
      const { data: newProfile } = await client
        .from('profiles')
        .insert({ id: userId })
        .select('id, first_name, last_name, profile_image_url, role, time_format_24h, welcome_notification_sent, personal_room_id')
        .single();
      if (newProfile) setProfile(newProfile as UserProfile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id && supabaseClient) {
      await internalFetchProfile(session.user.id, supabaseClient);
    }
  }, [session, internalFetchProfile, supabaseClient]);

  useEffect(() => {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      if (loading) setLoading(false);
    }, 7000);

    const processSession = (session: Session | null) => {
      setSession(session);
      if (session?.user?.id) {
        internalFetchProfile(session.user.id, supabaseClient);
      } else {
        setProfile(null);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
    };

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      processSession(session);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      processSession(session);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      subscription?.unsubscribe();
    };
  }, [supabaseClient, internalFetchProfile, loading]);

  const value = useMemo(() => ({
    supabase: supabaseClient,
    session,
    profile,
    loading,
    refreshProfile
  }), [supabaseClient, session, profile, loading, refreshProfile]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SessionContextProvider');
  }
  return context;
};