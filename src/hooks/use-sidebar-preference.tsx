"use client";

import { useState, useEffect, useCallback } from "react";

const LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY = 'sidebar_always_open';

export function useSidebarPreference() {
  const [isAlwaysOpen, setIsAlwaysOpen] = useState<boolean>(false); // Default to false for SSR
  const [mounted, setMounted] = useState(false); // New mounted state

  useEffect(() => {
    setMounted(true); // Component has mounted on client
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY);
      if (savedPreference !== null) { // Only update if a value was actually saved
        setIsAlwaysOpen(savedPreference === 'true');
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY, String(isAlwaysOpen));
    }
  }, [isAlwaysOpen, mounted]);

  const toggleAlwaysOpen = useCallback(() => {
    setIsAlwaysOpen(prev => !prev);
  }, []);

  return { isAlwaysOpen, toggleAlwaysOpen, mounted };
}