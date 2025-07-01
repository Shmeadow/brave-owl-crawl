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
  isMaximized: boolean; // Added
  isPinned: boolean; // Renamed from isDocked
  previousPosition?: { x: number; y: number }; // Store position before pinning
  previousSize?: { width: number; height: number }; // Store size before pinning
  normalSize?: { width: number; height: number }; // Size before minimizing or maximizing
  normalPosition?: { x: number; y: number }; // Position before maximizing
}

interface WidgetContextType {
  activeWidgets: WidgetState[];
  addWidget: (id: string, title: string) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, newPosition: { x: number; y: number }) => void;
  updateWidgetSize: (id: string, newSize: { width: number; height: number }) => void;
  bringWidgetToFront: (id: string) => void;
  minimizeWidget: (id: string) => void;
  maximizeWidget: (id: string) => void; // Added
  togglePinned: (id: string) => void; // Renamed from toggleDocked
  closeWidget: (id: string) => void;
  toggleWidget: (id: string, title: string) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

interface WidgetProviderProps {
  children: React.ReactNode;
  initialWidgetConfigs: { [key: string]: WidgetConfig };
  mainContentArea: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

// Constants for pinned widget positioning
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

  const recalculatePinnedWidgets = useCallback((currentWidgets: WidgetState[]) => {
    const pinned = currentWidgets.filter(w => w.isPinned).sort((a, b) => a.id.localeCompare(b.id)); // Sort to maintain consistent order
    let currentX = mainContentArea.left + DOCKED_WIDGET_HORIZONTAL_GAP; // Start from left edge of content area

    return currentWidgets.map(widget => {
      if (widget.isPinned) {
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
          isMinimized: true, // Always minimized when pinned
          isMaximized: false, // Cannot be maximized when pinned
        };
      }
      return widget;
    });
  }, [mainContentArea]); // mainContentArea is now a dependency

  useEffect(() => {
    const handleResize = () => {
      setActiveWidgets(prev => recalculatePinnedWidgets(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recalculatePinnedWidgets]);

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
              isMaximized: false, // Default to not maximized
              isPinned: false, // Default to not pinned
              normalSize: { width: config.initialWidth, height: config.initialHeight }, // Save initial size as normal
              normalPosition: clampedInitialPos, // Save initial position as normal
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
      return recalculatePinnedWidgets(updated); // Recalculate if a pinned widget is removed
    });
  }, [recalculatePinnedWidgets]);

  const updateWidgetPosition = useCallback((id: string, newPosition: { x: number; y: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => {
        if (widget.id === id && !widget.isPinned && !widget.isMaximized) { // Cannot drag if pinned or maximized
          const clampedPos = clampPosition(
            newPosition.x,
            newPosition.y,
            widget.size.width,
            widget.size.height,
            mainContentArea
          );
          return { ...widget, position: clampedPos, normalPosition: clampedPos }; // Update normalPosition too
        }
        return widget;
      })
    );
  }, [mainContentArea]); // mainContentArea is a dependency

  const updateWidgetSize = useCallback((id: string, newSize: { width: number; height: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => {
        if (widget.id === id && !widget.isPinned && !widget.isMinimized && !widget.isMaximized) { // Can only resize if not pinned, minimized, or maximized
          // When resizing, also clamp the position to ensure it doesn't go out of bounds
          const clampedPos = clampPosition(
            widget.position.x,
            widget.position.y,
            newSize.width,
            newSize.height,
            mainContentArea
          );
          return { ...widget, size: newSize, position: clampedPos, normalSize: newSize }; // Update normalSize too
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
        if (widget.id === id && !widget.isPinned) { // Cannot minimize if pinned
          if (widget.isMaximized) {
            // If maximized, restore to normal size/position
            return {
              ...widget,
              isMaximized: false,
              isMinimized: false,
              position: widget.normalPosition || initialWidgetConfigs[id].initialPosition,
              size: widget.normalSize || { width: initialWidgetConfigs[id].initialWidth, height: initialWidgetConfigs[id].initialHeight },
            };
          } else if (widget.isMinimized) {
            // If minimized, restore to normal size/position
            return {
              ...widget,
              isMinimized: false,
              position: widget.normalPosition || initialWidgetConfigs[id].initialPosition,
              size: widget.normalSize || { width: initialWidgetConfigs[id].initialWidth, height: initialWidgetConfigs[id].initialHeight },
            };
          } else {
            // If normal, minimize
            return {
              ...widget,
              isMinimized: true,
              normalSize: widget.size, // Save current size before minimizing
              normalPosition: widget.position, // Save current position before minimizing
              size: { width: MINIMIZED_WIDGET_WIDTH, height: MINIMIZED_WIDGET_HEIGHT },
              position: clampPosition(
                widget.position.x,
                widget.position.y,
                MINIMIZED_WIDGET_WIDTH,
                MINIMIZED_WIDGET_HEIGHT,
                mainContentArea
              ),
            };
          }
        }
        return widget;
      });
      return recalculatePinnedWidgets(updatedWidgets); // Recalculate if a widget's pinned state changes
    });
  }, [initialWidgetConfigs, recalculatePinnedWidgets, mainContentArea]);

  const maximizeWidget = useCallback((id: string) => { // New function
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id && !widget.isPinned) { // Cannot maximize if pinned
          if (widget.isMaximized) {
            // If maximized, restore to normal size/position
            return {
              ...widget,
              isMaximized: false,
              isMinimized: false, // Ensure not minimized
              position: widget.normalPosition || initialWidgetConfigs[id].initialPosition,
              size: widget.normalSize || { width: initialWidgetConfigs[id].initialWidth, height: initialWidgetConfigs[id].initialHeight },
            };
          } else {
            // If normal or minimized, maximize
            return {
              ...widget,
              isMaximized: true,
              isMinimized: false, // Ensure not minimized
              normalSize: widget.size, // Save current size
              normalPosition: widget.position, // Save current position
              size: { width: mainContentArea.width, height: mainContentArea.height },
              position: { x: mainContentArea.left, y: mainContentArea.top },
            };
          }
        }
        return widget;
      });
      return recalculatePinnedWidgets(updatedWidgets);
    });
  }, [initialWidgetConfigs, recalculatePinnedWidgets, mainContentArea]);

  const togglePinned = useCallback((id: string) => { // Renamed
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id) {
          if (widget.isPinned) {
            // Un-pin: restore previous state
            const config = initialWidgetConfigs[id];
            return {
              ...widget,
              isPinned: false,
              isMinimized: false, // Ensure it's not minimized when un-pinning
              isMaximized: false, // Ensure it's not maximized when un-pinning
              position: widget.previousPosition || clampPosition(config.initialPosition.x, config.initialPosition.y, config.initialWidth, config.initialHeight, mainContentArea), // Clamp restored position
              size: widget.previousSize || { width: config.initialWidth, height: config.initialHeight },
              previousPosition: undefined,
              previousSize: undefined,
            };
          } else {
            // Pin: save current state, then set pinned state
            return {
              ...widget,
              isPinned: true,
              isMinimized: true, // Always minimized when pinned
              isMaximized: false, // Cannot be maximized when pinned
              previousPosition: widget.position,
              previousSize: widget.size,
              // Position and size will be set by recalculatePinnedWidgets
            };
          }
        }
        return widget;
      });
      return recalculatePinnedWidgets(updatedWidgets);
    });
  }, [initialWidgetConfigs, recalculatePinnedWidgets, mainContentArea]);

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
      maximizeWidget, // Added
      togglePinned, // Renamed
      closeWidget,
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
      maximizeWidget,
      togglePinned,
      closeWidget,
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
};