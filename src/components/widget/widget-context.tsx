"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isDocked: boolean; // New: indicates if the widget is fixed in place
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
  toggleDocked: (id: string) => void; // New: function to toggle docked state
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'widget_states';

// Base default state for properties not related to position/size
const BASE_DEFAULT_WIDGET_STATE = {
  isOpen: false,
  isMinimized: false,
  isDocked: false,
};

interface InitialWidgetConfig {
  initialPosition: { x: number; y: number };
  initialWidth: number;
  initialHeight: number;
}

interface WidgetProviderProps {
  children: React.ReactNode;
  initialWidgetConfigs: Record<string, InitialWidgetConfig>;
}

export function WidgetProvider({ children, initialWidgetConfigs }: WidgetProviderProps) {
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>(() => {
    if (typeof window === 'undefined') {
      // Server-side rendering, return initial states based on configs
      const initialStates: Record<string, WidgetState> = {};
      for (const id in initialWidgetConfigs) {
        const config = initialWidgetConfigs[id];
        initialStates[id] = {
          ...BASE_DEFAULT_WIDGET_STATE,
          x: config.initialPosition.x,
          y: config.initialPosition.y,
          width: config.initialWidth,
          height: config.initialHeight,
          previousX: config.initialPosition.x,
          previousY: config.initialPosition.y,
          previousWidth: config.initialWidth,
          previousHeight: config.initialHeight,
        };
      }
      return initialStates;
    }

    const savedStates = localStorage.getItem(LOCAL_STORAGE_KEY);
    let parsedStates: Record<string, WidgetState> = {};
    if (savedStates) {
      try {
        parsedStates = JSON.parse(savedStates);
      } catch (e) {
        console.error("Failed to parse saved widget states:", e);
      }
    }

    const mergedStates: Record<string, WidgetState> = {};
    // Initialize with all known widgets from initialWidgetConfigs, then overlay saved state
    for (const id in initialWidgetConfigs) {
      const config = initialWidgetConfigs[id];
      mergedStates[id] = {
        ...BASE_DEFAULT_WIDGET_STATE,
        // Use initial config as default for position/size
        x: config.initialPosition.x,
        y: config.initialPosition.y,
        width: config.initialWidth,
        height: config.initialHeight,
        previousX: config.initialPosition.x,
        previousY: config.initialPosition.y,
        previousWidth: config.initialWidth,
        previousHeight: config.initialHeight,
        // Overlay saved state, if it exists
        ...parsedStates[id],
      };
    }
    return mergedStates;
  });

  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Save states to local storage whenever they change (only on client-side after mount)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(widgetStates));
    }
  }, [widgetStates, isMounted]);

  const updateWidgetState = useCallback((id: string, updates: Partial<WidgetState>) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id];
      if (!currentState) {
        console.warn(`Attempted to update non-existent widget: ${id}`);
        return prevStates;
      }
      return {
        ...prevStates,
        [id]: { ...currentState, ...updates }
      };
    });
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id];
      if (!currentState) {
        console.warn(`Attempted to toggle non-existent widget: ${id}`);
        return prevStates;
      }

      const newIsOpen = !currentState.isOpen;

      let newX = currentState.x;
      let newY = currentState.y;
      let newWidth = currentState.width;
      let newHeight = currentState.height;

      if (newIsOpen) {
        // When opening, restore from previous saved position/size
        // If previousX/Y/Width/Height are different from the initial config, use them.
        // Otherwise, use the initial config.
        const initialConfig = initialWidgetConfigs[id];
        if (
          currentState.previousX !== initialConfig.initialPosition.x ||
          currentState.previousY !== initialConfig.initialPosition.y ||
          currentState.previousWidth !== initialConfig.initialWidth ||
          currentState.previousHeight !== initialConfig.initialHeight
        ) {
          newX = currentState.previousX;
          newY = currentState.previousY;
          newWidth = currentState.previousWidth;
          newHeight = currentState.previousHeight;
        } else {
          // Fallback to initial config if no distinct previous state was saved
          newX = initialConfig.initialPosition.x;
          newY = initialConfig.initialPosition.y;
          newWidth = initialConfig.initialWidth;
          newHeight = initialConfig.initialHeight;
        }
        toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} opened!`);
      } else {
        toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} closed.`);
      }

      const newState = {
        ...currentState,
        isOpen: newIsOpen,
        isMinimized: false, // Always un-minimize when toggling open/close
        isDocked: false, // Always un-dock when toggling open/close
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      return { ...prevStates, [id]: newState };
    });
  }, [initialWidgetConfigs]);

  const minimizeWidget = useCallback((id: string) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id];
      if (!currentState) return prevStates;
      const newState = {
        ...currentState,
        isMinimized: true,
        isDocked: false, // Cannot be docked and minimized simultaneously
        // Save current position and size before minimizing
        previousX: currentState.x,
        previousY: currentState.y,
        previousWidth: currentState.width,
        previousHeight: currentState.height,
      };
      return {
        ...prevStates,
        [id]: newState
      };
    });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} minimized.`);
  }, []);

  const restoreWidget = useCallback((id: string) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id];
      if (!currentState) return prevStates;
      const newState = {
        ...currentState,
        isMinimized: false,
        isDocked: false, // Restoring means it's no longer docked
        // Restore position and size
        x: currentState.previousX,
        y: currentState.previousY,
        width: currentState.previousWidth,
        height: currentState.previousHeight,
      };
      return {
        ...prevStates,
        [id]: newState
      };
    });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} restored.`);
  }, []);

  const closeWidget = useCallback((id: string) => {
    updateWidgetState(id, { isOpen: false, isMinimized: false, isDocked: false });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} closed.`);
  }, [updateWidgetState]);

  const updateWidgetPosition = useCallback((id: string, x: number, y: number) => {
    updateWidgetState(id, { x, y });
  }, [updateWidgetState]);

  const updateWidgetSize = useCallback((id: string, width: number, height: number) => {
    updateWidgetState(id, { width, height });
  }, [updateWidgetState]);

  const toggleDocked = useCallback((id: string) => {
    setWidgetStates(prevStates => {
      const currentState = prevStates[id];
      if (!currentState) return prevStates;
      const newIsDocked = !currentState.isDocked;
      const newState = {
        ...currentState,
        isDocked: newIsDocked,
        isMinimized: false, // Cannot be docked and minimized simultaneously
        // When docking, save current position/size to restore later
        previousX: newIsDocked ? currentState.x : currentState.previousX,
        previousY: newIsDocked ? currentState.y : currentState.previousY,
        previousWidth: newIsDocked ? currentState.width : currentState.previousWidth,
        previousHeight: newIsDocked ? currentState.height : currentState.previousHeight,
      };
      return {
        ...prevStates,
        [id]: newState
      };
    });
    toast.info(`${id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} ${!widgetStates[id]?.isDocked ? 'docked' : 'undocked'}.`);
  }, [updateWidgetState, widgetStates]);


  const contextValue = React.useMemo(() => ({
    widgetStates,
    toggleWidget,
    minimizeWidget,
    restoreWidget,
    closeWidget,
    updateWidgetPosition,
    updateWidgetSize,
    toggleDocked,
  }), [widgetStates, toggleWidget, minimizeWidget, restoreWidget, closeWidget, updateWidgetPosition, updateWidgetSize, toggleDocked]);

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