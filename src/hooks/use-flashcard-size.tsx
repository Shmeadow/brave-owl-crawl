"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserPreferences, FlashcardSize } from '@/hooks/use-user-preferences'; // Import the new user preferences hook

const DEFAULT_SIZE: FlashcardSize = 'md'; // Default to medium

export function useFlashcardSize() {
  const { preferences, updatePreference, loading } = useUserPreferences();

  const size = preferences?.flashcard_size ?? DEFAULT_SIZE; // Default to 'md' if not loaded or null

  const setSize = useCallback((newSize: FlashcardSize) => {
    updatePreference('flashcard_size', newSize);
  }, [updatePreference]);

  return { size, setSize, loading };
}