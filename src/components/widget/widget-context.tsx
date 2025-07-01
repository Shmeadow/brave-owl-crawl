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
  mainContentArea: { // New prop for the available content area
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

// Constants for docked widget positioning
const POMODORO_WIDGET_WIDTH = 224; // From pomodoro-widget.tsx
const DOCKED_WIDGET_WIDTH = 192; // w-48
const DOCKED_WIDGET_HEIGHT = 48; // h-12 (to fit text better)
const DOCKED_WIDGET_HORIZONTAL_GAP = 4; // Gap between horizontally stacked widgets
const BOTTOM_DOCK_OFFSET = 16; // Corresponds to 'bottom-4' in Tailwind

const MINIMIZED_WIDGET_WIDTH = 192; // w-48
const MINIMIZED_WIDGET_HEIGHT = 48; // h-12 (to fit text better)

// Helper to clamp widget position within bounds
const clampPosition = (x: number, y: number, width: number, height: number, bounds: { left: number; top: number; width: number; height: number }) => {
  const maxX = bounds.left + bounds.width - width;
  const maxY = bounds.top + bounds.height - height;
  const clampedX = Math.max(bounds.left, Math.min(x, maxX));
  const clampedY = Math.max(bounds.top, Math.min(y, maxY));
  return { x: clampedX, y: clampedY };
};

export function WidgetProvider({ children, initialWidgetConfigs, mainContentArea }: WidgetProviderProps) {
  const [activeWidgets, setActiveWidgets] = useState<WidgetState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(900); // Start maxZIndex lower than Pomodoro (1001)

  const recalculateDockedWidgets = useCallback((currentWidgets: WidgetState[]) => {
    const docked = currentWidgets.filter(w => w.isDocked).sort((a, b) => a.id.localeCompare(b.id)); // Sort to maintain consistent order
    let currentX = mainContentArea.left + DOCKED_WIDGET_HORIZONTAL_GAP; // Start from left edge of content area

    return currentWidgets.map(widget => {
      if (widget.isDocked) {
        const newPosition = {
          x: currentX,
          y: mainContentArea.top + mainContentArea.height - DOCKED_WIDGET_HEIGHT - BOTTOM_DOCK_OFFSET,
        };
        currentX += DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP; // Increment for next widget

        return {
          ...widget,
          position: newPosition,
          size: {
            width: DOCKED_WIDGET_WIDTH,
            height: DOCKED_WIDGET_HEIGHT,
          },
          isMinimized: true, // Always minimized when docked
        };
      }
      return widget;
    });
  }, [mainContentArea]); // mainContentArea is now a dependency

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
        const newMaxZIndex = maxZIndex + 1;
        setMaxZIndex(newMaxZIndex);

        // Calculate initial position, clamped within mainContentArea
        const offsetAmount = 20; // pixels for stacking
        const offsetIndex = activeWidgets.length % 5; // Cycle through 5 different offsets
        const initialX = mainContentArea.left + offsetIndex * offsetAmount;
        const initialY = mainContentArea.top + offsetIndex * offsetAmount;

        const clampedInitialPos = clampPosition(
          initialX,
          initialY,
          config.initialWidth,
          config.initialHeight,
          mainContentArea
        );

        setActiveWidgets(prev => {
          const newWidgets = [
            ...prev,
            {
              id,
              title,
              position: clampedInitialPos,
              size: { width: config.initialWidth, height: config.initialHeight },
              zIndex: newMaxZIndex,
              isMinimized: false,
              isDocked: false,
              normalSize: { width: config.initialWidth, height: config.initialHeight },
            },
          ];
          return newWidgets;
        });
      }
    }
  }, [activeWidgets, initialWidgetConfigs, maxZIndex, mainContentArea]); // Add mainContentArea to dependencies

  const removeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updated = prev.filter(widget => widget.id !== id);
      return recalculateDockedWidgets(updated); // Recalculate if a docked widget is removed
    });
  }, [recalculateDockedWidgets]);

  const updateWidgetPosition = useCallback((id: string, newPosition: { x: number; y: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => {
        if (widget.id === id && !widget.isDocked) {
          const clampedPos = clampPosition(
            newPosition.x,
            newPosition.y,
            widget.size.width,
            widget.size.height,
            mainContentArea
          );
          return { ...widget, position: clampedPos };
        }
        return widget;
      })
    );
  }, [mainContentArea]); // mainContentArea is a dependency

  const updateWidgetSize = useCallback((id: string, newSize: { width: number; height: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => {
        if (widget.id === id && !widget.isDocked && !widget.isMinimized) {
          // When resizing, also clamp the position to ensure it doesn't go out of bounds
          const clampedPos = clampPosition(
            widget.position.x,
            widget.position.y,
            newSize.width,
            newSize.height,
            mainContentArea
          );
          return { ...widget, size: newSize, position: clampedPos };
        }
        return widget;
      })
    );
  }, [mainContentArea]); // mainContentArea is a dependency

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
            // If docked, un-dock and maximize
            const config = initialWidgetConfigs[id];
            return {
              ...widget,
              isDocked: false,
              isMinimized: false, // Maximize when un-docking
              position: widget.previousPosition || clampPosition(config.initialPosition.x, config.initialPosition.y, config.initialWidth, config.initialHeight, mainContentArea), // Clamp restored position
              size: widget.previousSize || { width: config.initialWidth, height: config.initialHeight },
              previousPosition: undefined,
              previousSize: undefined,
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
  }, [initialWidgetConfigs, recalculateDockedWidgets, mainContentArea]); // mainContentArea is a dependency

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
              position: widget.previousPosition || clampPosition(config.initialPosition.x, config.initialPosition.y, config.initialWidth, config.initialHeight, mainContentArea), // Clamp restored position
              size: widget.previousSize || { width: config.initialWidth, height: config.initialHeight },
              previousPosition: undefined,
              previousSize: undefined,
            };
          } else {
            // Dock: save current state, then set docked state
            return {
              ...widget,
              isDocked: true,
              isMinimized: true, // Always minimized when docked
              previousPosition: widget.position,
              previousSize: widget.size,
              // Position and size will be set by recalculateDockedWidgets
            };
          }
        }
        return widget;
      });
      return recalculateDockedWidgets(updatedWidgets);
    });
  }, [initialWidgetConfigs, recalculateDockedWidgets, mainContentArea]); // mainContentArea is a dependency

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