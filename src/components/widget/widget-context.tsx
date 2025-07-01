"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";

interface WidgetConfig {
  initialPosition: { x: number; y: number };
  initialWidth: number;
  initialHeight: number;
}

interface WidgetState {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isDocked: boolean;
  previousPosition?: { x: number; y: number }; // Store position before docking
  previousSize?: { width: number; height: number }; // Store size before docking
  normalSize?: { width: number; height: number }; // Store size before minimizing
}

interface WidgetContextType {
  activeWidgets: WidgetState[];
  addWidget: (id: string, title: string) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, newPosition: { x: number; y: number }) => void;
  updateWidgetSize: (id: string, newSize: { width: number; height: number }) => void;
  bringWidgetToFront: (id: string) => void;
  minimizeWidget: (id: string) => void;
  closeWidget: (id: string) => void;
  toggleDocked: (id: string) => void;
  toggleWidget: (id: string, title: string) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

interface WidgetProviderProps {
  children: React.ReactNode;
  initialWidgetConfigs: { [key: string]: WidgetConfig };
}

const DOCKED_WIDGET_WIDTH = 300;
const HEADER_HEIGHT = 64; // h-16
const RIGHT_MARGIN = 4; // Small margin from the right edge
const MINIMIZED_WIDGET_WIDTH = 192; // w-48
const MINIMIZED_WIDGET_HEIGHT = 40; // h-10

export function WidgetProvider({ children, initialWidgetConfigs }: WidgetProviderProps) {
  const [activeWidgets, setActiveWidgets] = useState<WidgetState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1000);

  const recalculateDockedWidgets = useCallback((currentWidgets: WidgetState[]) => {
    const docked = currentWidgets.filter(w => w.isDocked);
    const availableHeight = window.innerHeight - HEADER_HEIGHT;
    const singleWidgetHeight = docked.length > 0 ? availableHeight / docked.length : 0;

    return currentWidgets.map(widget => {
      if (widget.isDocked) {
        const index = docked.findIndex(d => d.id === widget.id);
        return {
          ...widget,
          position: {
            x: window.innerWidth - DOCKED_WIDGET_WIDTH - RIGHT_MARGIN,
            y: HEADER_HEIGHT + index * singleWidgetHeight,
          },
          size: {
            width: DOCKED_WIDGET_WIDTH,
            height: singleWidgetHeight,
          },
        };
      }
      return widget;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setActiveWidgets(prev => recalculateDockedWidgets(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recalculateDockedWidgets]);

  const addWidget = useCallback((id: string, title: string) => {
    if (!activeWidgets.some(widget => widget.id === id)) {
      const config = initialWidgetConfigs[id];
      if (config) {
        setActiveWidgets(prev => {
          const newWidgets = [
            ...prev,
            {
              id,
              title,
              position: config.initialPosition,
              size: { width: config.initialWidth, height: config.initialHeight },
              zIndex: maxZIndex + 1,
              isMinimized: false,
              isDocked: false,
              normalSize: { width: config.initialWidth, height: config.initialHeight }, // Store initial normal size
            },
          ];
          setMaxZIndex(prev => prev + 1);
          return newWidgets;
        });
      }
    }
  }, [activeWidgets, initialWidgetConfigs, maxZIndex]);

  const removeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updated = prev.filter(widget => widget.id !== id);
      return recalculateDockedWidgets(updated); // Recalculate if a docked widget is removed
    });
  }, [recalculateDockedWidgets]);

  const updateWidgetPosition = useCallback((id: string, newPosition: { x: number; y: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => (widget.id === id && !widget.isDocked ? { ...widget, position: newPosition } : widget))
    );
  }, []);

  const updateWidgetSize = useCallback((id: string, newSize: { width: number; height: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => (widget.id === id && !widget.isDocked && !widget.isMinimized ? { ...widget, size: newSize } : widget))
    );
  }, []);

  const bringWidgetToFront = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const newMaxZIndex = maxZIndex + 1;
      setMaxZIndex(newMaxZIndex);
      return prev.map(widget =>
        widget.id === id ? { ...widget, zIndex: newMaxZIndex } : widget
      );
    });
  }, [maxZIndex]);

  const minimizeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id) {
          if (widget.isDocked) {
            // If docked, un-dock and then minimize
            const config = initialWidgetConfigs[id];
            return {
              ...widget,
              isDocked: false,
              isMinimized: true,
              position: widget.previousPosition || config.initialPosition, // Restore original position
              size: { width: MINIMIZED_WIDGET_WIDTH, height: MINIMIZED_WIDGET_HEIGHT }, // Fixed minimized size
              previousPosition: undefined, // Clear previous docked state
              previousSize: undefined, // Clear previous docked state
            };
          } else {
            // If floating (normal or already minimized), toggle minimized state
            if (widget.isMinimized) {
              // Maximize: restore previous size, keep current position
              return {
                ...widget,
                isMinimized: false,
                size: widget.normalSize || { width: initialWidgetConfigs[id].initialWidth, height: initialWidgetConfigs[id].initialHeight },
                normalSize: undefined, // Clear previous normal size
              };
            } else {
              // Minimize: save current size, set fixed minimized size, keep current position
              return {
                ...widget,
                isMinimized: true,
                normalSize: widget.size, // Save current size before minimizing
                size: { width: MINIMIZED_WIDGET_WIDTH, height: MINIMIZED_WIDGET_HEIGHT }, // Fixed minimized size
              };
            }
          }
        }
        return widget;
      });
      return recalculateDockedWidgets(updatedWidgets); // Recalculate if a widget's docked state changes
    });
  }, [initialWidgetConfigs, recalculateDockedWidgets]);

  const toggleDocked = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id) {
          if (widget.isDocked) {
            // Un-dock: restore previous state
            const config = initialWidgetConfigs[id];
            return {
              ...widget,
              isDocked: false,
              isMinimized: false, // Ensure it's not minimized when un-docking
              position: widget.previousPosition || config.initialPosition,
              size: widget.previousSize || { width: config.initialWidth, height: config.initialHeight },
              previousPosition: undefined,
              previousSize: undefined,
            };
          } else {
            // Dock: save current state
            return {
              ...widget,
              isDocked: true,
              isMinimized: false, // Ensure it's not minimized when docking
              previousPosition: widget.position,
              previousSize: widget.size,
            };
          }
        }
        return widget;
      });
      return recalculateDockedWidgets(updatedWidgets);
    });
  }, [initialWidgetConfigs, recalculateDockedWidgets]);

  const closeWidget = useCallback((id: string) => {
    removeWidget(id);
  }, [removeWidget]);

  const toggleWidget = useCallback((id: string, title: string) => {
    if (activeWidgets.some(widget => widget.id === id)) {
      closeWidget(id); // Use closeWidget to ensure recalculation
    } else {
      addWidget(id, title);
    }
  }, [activeWidgets, addWidget, closeWidget]);

  const contextValue = useMemo(
    () => ({
      activeWidgets,
      addWidget,
      removeWidget,
      updateWidgetPosition,
      updateWidgetSize,
      bringWidgetToFront,
      minimizeWidget,
      closeWidget,
      toggleDocked,
      toggleWidget,
    }),
    [
      activeWidgets,
      addWidget,
      removeWidget,
      updateWidgetPosition,
      updateWidgetSize,
      bringWidgetToFront,
      minimizeWidget,
      closeWidget,
      toggleDocked,
      toggleWidget,
    ]
  );

  return (
    <WidgetContext.Provider value={contextValue}>
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidget() {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
}