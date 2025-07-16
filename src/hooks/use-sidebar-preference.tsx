"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUserPreferences } from "./use-user-preferences"; // Import the new user preferences hook

export function useSidebarPreference() {
  const { preferences, updatePreference, loading } = useUserPreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAlwaysOpen = preferences?.is_sidebar_always_open ?? false; // Default to false if not loaded or null

  const toggleAlwaysOpen = useCallback(() => {
    updatePreference('is_sidebar_always_open', !isAlwaysOpen);
  }, [isAlwaysOpen, updatePreference]);

  return { isAlwaysOpen, toggleAlwaysOpen, mounted, loading };
}