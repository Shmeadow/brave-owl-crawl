"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from './client';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: string | null;
  time_format_24h: boolean | null;
  welcome_notification_sent: boolean | null;
  personal_room_id: string | null; // Added personal_room_id
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Make internalFetchProfile a stable callback that only depends on its own setters
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
      // If no profile found, create a default one
      const { data: newProfile, error: insertError } = await client
        .from('profiles')
        .insert({ id: userId, first_name: null, last_name: null, profile_image_url: null, role: 'user', time_format_24h: true, welcome_notification_sent: false })
        .select('id, first_name, last_name, profile_image_url, role, time_format_24h, welcome_notification_sent, personal_room_id')
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
      await internalFetchProfile(session.user.id, supabaseClient);
    }
  }, [session, internalFetchProfile, supabaseClient]);

  useEffect(() => {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }

    // Set a timeout as a fallback to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      console.warn("Supabase auth loading timed out. Proceeding with app.");
      toast.warning("Could not verify session in time. You may need to log in again.");
      if (loading) setLoading(false);
    }, 7000);

    // This function now only handles setting state and fetching profile in the background
    const processSession = async (session: Session | null) => {
      setSession(session);
      if (session?.user?.id) {
        await internalFetchProfile(session.user.id, supabaseClient);
      } else {
        setProfile(null);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setLoading(false); // Unblock the app as soon as session AND profile are processed
    };

    // Initial session check
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      processSession(session);
    }).catch(error => {
      console.error("Error fetching initial Supabase session:", error);
      processSession(null); // Treat error as a logged-out state
    });

    // Subscribe to subsequent auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      processSession(session);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription?.unsubscribe();
    };
  }, [supabaseClient, internalFetchProfile, loading]); // Added loading to dependency array

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