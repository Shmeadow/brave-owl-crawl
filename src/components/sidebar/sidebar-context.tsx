"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWidget } from '../widget/widget-context'; // Import useWidget
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Sparkles, Wind, BookOpen, Goal } from "lucide-react";

// Define navigation items and their icons
export const NAV_ITEMS = {
  "spaces": { label: "Spaces", icon: LayoutGrid },
  "sounds": { label: "Sounds", icon: Volume2 },
  "calendar": { label: "Calendar", icon: Calendar },
  "timer": { label: "Timer", icon: Timer },
  "tasks": { label: "Tasks", icon: ListTodo },
  "notes": { label: "Notes", icon: NotebookPen },
  "media": { label: "Media", icon: Image },
  "fortune": { label: "Fortune", icon: Sparkles },
  "breathe": { label: "Breathe", icon: Wind },
  "flash-cards": { label: "Flash Cards", icon: BookOpen },
  "goal-focus": { label: "Goal Focus", icon: Goal },
};

type ActivePanel = keyof typeof NAV_ITEMS;

interface SidebarContextType {
  activePanel: ActivePanel | null;
  setActivePanel: (panel: ActivePanel, label: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanelState] = useState<ActivePanel | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { toggleWidget } = useWidget(); // Get toggleWidget from WidgetContext (now safe to call here)

  // Load active panel from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPanel = localStorage.getItem('active_sidebar_panel');
      if (savedPanel && Object.keys(NAV_ITEMS).includes(savedPanel)) {
        setActivePanelState(savedPanel as ActivePanel);
        // Also ensure the widget is open if it was saved as active
        const savedLabel = NAV_ITEMS[savedPanel as ActivePanel].label;
        toggleWidget(savedPanel, savedLabel);
      }
    }
  }, [toggleWidget]);

  // Save active panel to local storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activePanel) {
        localStorage.setItem('active_sidebar_panel', activePanel);
      } else {
        localStorage.removeItem('active_sidebar_panel');
      }
    }
  }, [activePanel]);

  const handleSetActivePanel = useCallback((panel: ActivePanel, label: string) => {
    setActivePanelState(prevPanel => {
      if (prevPanel === panel) {
        // Clicking the active panel again should close it
        toggleWidget(panel, label); // Close the widget
        return null; // Set activePanel to null
      } else {
        // Clicking a new panel
        if (prevPanel) {
          toggleWidget(prevPanel, NAV_ITEMS[prevPanel].label); // Close the previously active widget
        }
        toggleWidget(panel, label); // Open the new widget
        return panel; // Set new activePanel
      }
    });
  }, [toggleWidget]);

  return (
    <SidebarContext.Provider value={{ activePanel, setActivePanel: handleSetActivePanel, isSidebarOpen, setIsSidebarOpen }}>
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