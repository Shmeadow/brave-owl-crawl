"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  previousX: number; // Store previous X for restore
  previousY: number; // Store previous Y for restore
  previousWidth: number; // Store previous width for restore
  previousHeight: number; // Store previous height for restore
}

interface WidgetContextType {
  widgetStates: Record<string, WidgetState>;
  toggleWidget: (id: string) => void;
  minimizeWidget: (id: string) => void;
  restoreWidget: (id: string) => void;
  closeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  updateWidgetSize: (id: string, width: number, height: number) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'widget_states';

const DEFAULT_WIDGET_STATE = {
  isOpen: false,
  isMinimized: false,
  x: 50,
  y: 50,
  width: 400,
  height: 500,
  previousX: 50,
  previousY: 50,
  previousWidth: 400,
  previousHeight: 500,
};

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
          const parsedStates = JSON.parse(savedStates);
          // Merge with default state to ensure new properties are initialized
          const mergedStates = Object.keys(parsedStates).reduce((acc, key) => {
            acc[key] = { ...DEFAULT_WIDGET_STATE, ...parsedStates[key] };
            return acc;
          }, {} as Record<string, WidgetState>);
          setWidgetStates(mergedStates);
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
      const currentState = prevStates[id] || DEFAULT_WIDGET_STATE;
      return {
        ...prevStates,
        [id]: { ...currentState, ...updates }
      };
    });
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id] || DEFAULT_WIDGET_STATE;
      const newIsOpen = !currentState.isOpen;
      const newIsMinimized = newIsOpen ? false : currentState.isMinimized; // Unminimize if opening

      if (newIsOpen) {
        toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} opened!`);
      } else {
        toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} closed.`);
      }

      return {
        ...prevStates,
        [id]: { ...currentState, isOpen: newIsOpen, isMinimized: newIsMinimized }
      };
    });
  }, []);

  const minimizeWidget = useCallback((id: string) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id] || DEFAULT_WIDGET_STATE;
      return {
        ...prevStates,
        [id]: {
          ...currentState,
          isMinimized: true,
          // Save current position and size before minimizing
          previousX: currentState.x,
          previousY: currentState.y,
          previousWidth: currentState.width,
          previousHeight: currentState.height,
        }
      };
    });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} minimized.`);
  }, []);

  const restoreWidget = useCallback((id: string) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id] || DEFAULT_WIDGET_STATE;
      return {
        ...prevStates,
        [id]: {
          ...currentState,
          isMinimized: false,
          // Restore position and size
          x: currentState.previousX,
          y: currentState.previousY,
          width: currentState.previousWidth,
          height: currentState.previousHeight,
        }
      };
    });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} restored.`);
  }, []);

  const closeWidget = useCallback((id: string) => {
    updateWidgetState(id, { isOpen: false, isMinimized: false });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} closed.`);
  }, [updateWidgetState]);

  const updateWidgetPosition = useCallback((id: string, x: number, y: number) => {
    updateWidgetState(id, { x, y });
  }, [updateWidgetState]);

  const updateWidgetSize = useCallback((id: string, width: number, height: number) => {
    updateWidgetState(id, { width, height });
  }, [updateWidgetState]);

  const contextValue = React.useMemo(() => ({
    widgetStates,
    toggleWidget,
    minimizeWidget,
    restoreWidget,
    closeWidget,
    updateWidgetPosition,
    updateWidgetSize,
  }), [widgetStates, toggleWidget, minimizeWidget, restoreWidget, closeWidget, updateWidgetPosition, updateWidgetSize]);

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