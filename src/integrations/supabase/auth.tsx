"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client'; // Now `supabase` can be null

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: string | null;
}

interface SupabaseContextType {
  supabase: SupabaseClient | null; // Allow null
  session: Session | null;
  profile: UserProfile | null; // Add profile to context
  loading: boolean;
  refreshProfile: () => Promise<void>; // Add this function
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SessionContextProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null); // State for user profile
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, role')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching user profile:", error);
      setProfile(null);
    } else if (data) {
      setProfile(data as UserProfile);
    } else {
      // If no profile found, create a default one
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, first_name: null, last_name: null, profile_image_url: null, role: 'user' })
        .select('id, first_name, last_name, profile_image_url, role')
        .single();
      if (insertError) {
        console.error("Error creating default profile:", insertError);
      } else if (newProfile) {
        setProfile(newProfile as UserProfile);
      }
    }
  }, []); // fetchProfile depends only on supabase, which is a constant import

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]); // Depends on session and fetchProfile

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.");
      setLoading(false);
      return;
    }

    const handleAuthStateChange = async (_event: string, currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null); // Clear profile if no session
      }
      setLoading(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleAuthStateChange('INITIAL_LOAD', initialSession);
    }).catch(error => {
      console.error("Error fetching initial Supabase session:", error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, [fetchProfile]); // Dependency array includes fetchProfile

  return (
    <SupabaseContext.Provider value={{ supabase, session, profile, loading, refreshProfile }}>
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