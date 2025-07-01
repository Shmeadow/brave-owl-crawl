"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  // We'll add position and zIndex later for drag-and-drop
}

interface WidgetContextType {
  widgetStates: Record<string, WidgetState>;
  toggleWidget: (id: string) => void;
  minimizeWidget: (id: string) => void;
  restoreWidget: (id: string) => void;
  closeWidget: (id: string) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'widget_states';

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>({});
  const [isMounted, setIsMounted] = useState(false);

  // Load states from local storage on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedStates = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStates) {
        try {
          setWidgetStates(JSON.parse(savedStates));
        } catch (e) {
          console.error("Failed to parse saved widget states:", e);
          // Fallback to default if parsing fails
          setWidgetStates({});
        }
      }
    }
  }, []);

  // Save states to local storage whenever they change
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(widgetStates));
    }
  }, [widgetStates, isMounted]);

  const updateWidgetState = useCallback((id: string, updates: Partial<WidgetState>) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id] || { isOpen: false, isMinimized: false };
      return {
        ...prevStates,
        [id]: { ...currentState, ...updates }
      };
    });
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id] || { isOpen: false, isMinimized: false };
      const newIsOpen = !currentState.isOpen;
      const newIsMinimized = newIsOpen ? false : currentState.isMinimized; // Unminimize if opening

      if (newIsOpen) {
        toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} opened!`);
      } else {
        toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} closed.`);
      }

      return {
        ...prevStates,
        [id]: { isOpen: newIsOpen, isMinimized: newIsMinimized }
      };
    });
  }, []);

  const minimizeWidget = useCallback((id: string) => {
    updateWidgetState(id, { isMinimized: true });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} minimized.`);
  }, [updateWidgetState]);

  const restoreWidget = useCallback((id: string) => {
    updateWidgetState(id, { isMinimized: false });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} restored.`);
  }, [updateWidgetState]);

  const closeWidget = useCallback((id: string) => {
    updateWidgetState(id, { isOpen: false, isMinimized: false });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} closed.`);
  }, [updateWidgetState]);

  const contextValue = React.useMemo(() => ({
    widgetStates,
    toggleWidget,
    minimizeWidget,
    restoreWidget,
    closeWidget,
  }), [widgetStates, toggleWidget, minimizeWidget, restoreWidget, closeWidget]);

  return (
    <WidgetContext.Provider value={contextValue}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error('useWidget must be used within a WidgetProvider');
  }
  return context;
};