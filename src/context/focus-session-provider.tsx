"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface FocusSessionContextType {
  activeGoalTitle: string | null;
  isFocusSessionActive: boolean;
  startFocusSession: (title: string) => void;
  endFocusSession: () => void;
}

const FocusSessionContext = createContext<FocusSessionContextType | undefined>(undefined);

export function FocusSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeGoalTitle, setActiveGoalTitle] = useState<string | null>(null);
  const [isFocusSessionActive, setIsFocusSessionActive] = useState(false);

  const startFocusSession = useCallback((title: string) => {
    setActiveGoalTitle(title);
    setIsFocusSessionActive(true);
  }, []);

  const endFocusSession = useCallback(() => {
    setActiveGoalTitle(null);
    setIsFocusSessionActive(false);
  }, []);

  const value = {
    activeGoalTitle,
    isFocusSessionActive,
    startFocusSession,
    endFocusSession,
  };

  return (
    <FocusSessionContext.Provider value={value}>
      {children}
    </FocusSessionContext.Provider>
  );
}

export const useFocusSession = () => {
  const context = useContext(FocusSessionContext);
  if (context === undefined) {
    throw new Error('useFocusSession must be used within a FocusSessionProvider');
  }
  return context;
};