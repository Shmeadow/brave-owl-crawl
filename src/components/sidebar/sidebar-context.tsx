"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ActivePanel = 'spaces' | 'sounds' | 'calendar' | 'timer' | 'tasks' | 'notes' | 'media' | 'fortune' | 'breathe' | 'flash-cards' | 'goal-focus';

interface SidebarContextType {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('spaces');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Controls the hover state of the sidebar

  // Load active panel from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPanel = localStorage.getItem('active_sidebar_panel');
      if (savedPanel && ['spaces', 'sounds', 'calendar', 'timer', 'tasks', 'notes', 'media', 'fortune', 'breathe', 'flash-cards', 'goal-focus'].includes(savedPanel)) {
        setActivePanel(savedPanel as ActivePanel);
      }
    }
  }, []);

  // Save active panel to local storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_sidebar_panel', activePanel);
    }
  }, [activePanel]);

  return (
    <SidebarContext.Provider value={{ activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};