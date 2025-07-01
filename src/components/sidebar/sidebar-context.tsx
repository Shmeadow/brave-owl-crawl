"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ActivePanel = 'sounds' | 'calendar' | 'timer' | 'tasks' | 'notes' | 'flash-cards' | 'goal-focus'; // Removed 'spaces', 'media', 'fortune', 'breathe'

interface SidebarContextType {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('sounds'); // Default to 'sounds'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Controls the hover state of the sidebar

  // Load active panel from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPanel = localStorage.getItem('active_sidebar_panel');
      // Updated valid panels list
      const validPanels: ActivePanel[] = ['sounds', 'calendar', 'timer', 'tasks', 'notes', 'flash-cards', 'goal-focus'];
      if (savedPanel && validPanels.includes(savedPanel as ActivePanel)) {
        setActivePanel(savedPanel as ActivePanel);
      } else {
        setActivePanel('sounds'); // Default to a valid panel if saved one is invalid
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