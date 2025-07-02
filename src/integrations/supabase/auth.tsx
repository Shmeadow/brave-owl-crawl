"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from './client';

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
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseClient) {
      console.log("SessionContextProvider: Attempting to create Supabase client...");
      const client = createBrowserClient();
      setSupabaseClient(client);
      if (!client) {
        console.error("SessionContextProvider: Supabase client failed to initialize.");
        setLoading(false);
      } else {
        console.log("SessionContextProvider: Supabase client created successfully.");
      }
    }
  }, [supabaseClient]); // Added supabaseClient to dependency array

  const fetchProfile = useCallback(async (userId: string, client: SupabaseClient) => {
    const { data, error } = await client
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, role, time_format_24h')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching user profile:", error);
      setProfile(null);
    } else if (data) {
      setProfile(data as UserProfile);
    } else {
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

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, session, profile, loading, refreshProfile }}>
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