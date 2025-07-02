"use client";

import React, { createContext, useContext, useState, useEffect } from 'react'; // Removed useCallback

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPanel = localStorage.getItem('active_sidebar_panel');
      if (savedPanel && ['spaces', 'sounds', 'calendar', 'timer', 'tasks', 'notes', 'media', 'fortune', 'breathe', 'flash-cards', 'goal-focus'].includes(savedPanel)) {
        setActivePanel(savedPanel as ActivePanel);
      }
    }
  }, []);

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