"use client";

import { useState, useEffect, useCallback } from "react";

const LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY = 'sidebar_always_open';

export function useSidebarPreference() {
  const [isAlwaysOpen, setIsAlwaysOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY);
      return savedPreference === 'true'; // Default to false if not set
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SIDEBAR_PREFERENCE_KEY, String(isAlwaysOpen));
    }
  }, [isAlwaysOpen]);

  const toggleAlwaysOpen = useCallback(() => {
    setIsAlwaysOpen(prev => !prev);
  }, []);

  return { isAlwaysOpen, toggleAlwaysOpen };
}