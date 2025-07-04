"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from './client'; // Import the function

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: string | null;
  time_format_24h: boolean | null;
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
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null); // State for the Supabase client
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect to initialize Supabase client once on mount
  useEffect(() => {
    if (!supabaseClient) { // Only attempt to initialize if not already initialized
      console.log("SessionContextProvider: Attempting to create Supabase client...");
      const client = createBrowserClient();
      setSupabaseClient(client);
      if (!client) {
        console.error("SessionContextProvider: Supabase client failed to initialize.");
        setLoading(false); // If client fails to initialize, stop loading
      } else {
        console.log("SessionContextProvider: Supabase client created successfully.");
      }
    }
  }, [supabaseClient]); // Add supabaseClient as a dependency

  const fetchProfile = useCallback(async (userId: string, client: SupabaseClient) => {
    const { data, error } = await client
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, role, time_format_24h')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching user profile:", error);
      setProfile(null);
    } else if (data) {
      setProfile(data as UserProfile);
    } else {
      // If no profile found, create a default one
      const { data: newProfile, error: insertError } = await client
        .from('profiles')
        .insert({ id: userId, first_name: null, last_name: null, profile_image_url: null, role: 'user', time_format_24h: true })
        .select('id, first_name, last_name, profile_image_url, role, time_format_24h')
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
    if (!supabaseClient) {
      // Supabase client is not yet available, wait for it.
      if (loading) {
        console.log("SessionContextProvider: Waiting for Supabase client to be ready...");
      }
      return;
    }

    console.log("SessionContextProvider: Supabase client is ready. Setting up auth state listener.");
    const handleAuthStateChange = async (_event: string, currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession) {
        console.log("Auth state changed: User is logged in. Fetching profile...");
        await fetchProfile(currentSession.user.id, supabaseClient);
      } else {
        console.log("Auth state changed: User is logged out. Clearing profile.");
        setProfile(null);
      }
      setLoading(false);
    };

    // Initial session check
    supabaseClient.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Initial Supabase session fetched.");
      handleAuthStateChange('INITIAL_LOAD', initialSession);
    }).catch(error => {
      console.error("Error fetching initial Supabase session:", error);
      setLoading(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("Cleaning up Supabase auth state listener.");
      subscription.unsubscribe();
    };
  }, [supabaseClient, fetchProfile, loading]);

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