"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { usePersistentData } from "./use-persistent-data"; // Import the new hook

interface DbUserPreference {
  user_id: string;
  is_sidebar_always_open: boolean;
}

const LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY = 'sidebar_always_open';
const SUPABASE_TABLE_NAME = 'user_preferences';

export function useSidebarPreference() {
  const { session } = useSupabase();

  const {
    data: isAlwaysOpen,
    loading,
    isLoggedInMode,
    setData: setIsAlwaysOpenState,
    fetchData,
  } = usePersistentData<boolean, DbUserPreference>({
    localStorageKey: LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: false, // Keep as literal, but rely on explicit return type below
    selectQuery: 'is_sidebar_always_open',
    transformFromDb: (dbData: DbUserPreference): boolean => dbData.is_sidebar_always_open, // Explicit return type
    transformToDb: (appData: boolean, userId: string) => ({
      user_id: userId,
      is_sidebar_always_open: appData,
    }),
    onConflictColumn: 'user_id',
    isSingleton: true,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleAlwaysOpen = useCallback(async () => {
    setIsAlwaysOpenState(prev => !prev);
  }, [setIsAlwaysOpenState]);

  return { isAlwaysOpen, toggleAlwaysOpen, mounted, loading };
}