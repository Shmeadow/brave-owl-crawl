"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from './client';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: string | null;
  time_format_24h: boolean | null;
  welcome_notification_sent: boolean | null;
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
  // Create the Supabase client directly here, ensuring it's available immediately on the client.
  // This runs only once per component instance on the client side.
  const supabaseClient = useMemo(() => {
    if (typeof window !== 'undefined') {
      const client = createBrowserClient();
      if (!client) {
        console.error("SessionContextProvider: Supabase client failed to initialize.");
      }
      return client;
    }
    return null; // Return null on server or if window is not defined
  }, []); // Empty dependency array ensures it runs only once

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, client: SupabaseClient) => {
    const { data, error } = await client
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, role, time_format_24h, welcome_notification_sent')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching user profile:", error);
      setProfile(null);
    } else if (data) {
      setProfile(data as UserProfile);
    } else {
      // If no profile found, create a default one
      const { data: newProfile, error: insertError } = await client
        .from('profiles')
        .insert({ id: userId, first_name: null, last_name: null, profile_image_url: null, role: 'user', time_format_24h: true, welcome_notification_sent: false })
        .select('id, first_name, last_name, profile_image_url, role, time_format_24h, welcome_notification_sent')
        .single();
      if (insertError) {
        console.error("Error creating default profile:", insertError);
      } else if (newProfile) {
        setProfile(newProfile as UserProfile);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id && supabaseClient) {
      await fetchProfile(session.user.id, supabaseClient);
    }
  }, [session, fetchProfile, supabaseClient]);

  useEffect(() => {
    if (!supabaseClient) { // Wait for supabaseClient to be ready
      return;
    }

    const handleAuthStateChange = async (_event: string, currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession) {
        await fetchProfile(currentSession.user.id, supabaseClient);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    // Initial session check
    supabaseClient.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleAuthStateChange('INITIAL_LOAD', initialSession);
    }).catch(error => {
      console.error("Error fetching initial Supabase session:", error);
      setLoading(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient, fetchProfile]);

  const value = useMemo(() => ({
    supabase: supabaseClient,
    session,
    profile,
    loading,
    refreshProfile
  }), [supabaseClient, session, profile, loading, refreshProfile]);

  // Always render children, the 'loading' state will manage content visibility
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