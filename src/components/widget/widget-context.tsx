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
  isMaximized: boolean;
  isPinned: boolean;
  previousPosition?: { x: number; y: number };
  previousSize?: { width: number; height: number };
  normalSize?: { width: number; height: number };
  normalPosition?: { x: number; y: number };
}

interface WidgetContextType {
  activeWidgets: WidgetState[];
  addWidget: (id: string, title: string) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, newPosition: { x: number; y: number }) => void;
  updateWidgetSize: (id: string, newSize: { width: number; height: number }) => void;
  bringWidgetToFront: (id: string) => void;
  minimizeWidget: (id: string) => void;
  maximizeWidget: (id: string) => void;
  togglePinned: (id: string) => void;
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
  }, [mainContentArea]);

  useEffect(() => {
    const handleResize = () => {
      setActiveWidgets(prev => recalculatePinnedWidgets(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recalculatePinnedWidgets]);

  // New effect to re-clamp floating widget positions when mainContentArea changes
  useEffect(() => {
    setActiveWidgets(prevWidgets => {
      return prevWidgets.map(widget => {
        if (!widget.isPinned && !widget.isMaximized) { // Only re-clamp floating, non-maximized widgets
          const clampedPos = clampPosition(
            widget.position.x,
            widget.position.y,
            widget.size.width,
            widget.size.height,
            mainContentArea
          );
          // If position changed due to clamping, update it
          if (clampedPos.x !== widget.position.x || clampedPos.y !== widget.position.y) {
            return { ...widget, position: clampedPos };
          }
        }
        return widget;
      });
    });
  }, [mainContentArea]); // Dependency on mainContentArea

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
              isMaximized: false,
              isPinned: false,
              normalSize: { width: config.initialWidth, height: config.initialHeight },
              normalPosition: clampedInitialPos,
            },
          ];
          return newWidgets;
        });
      }
    }
  }, [activeWidgets, initialWidgetConfigs, maxZIndex, mainContentArea]);

  const removeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updated = prev.filter(widget => widget.id !== id);
      return recalculatePinnedWidgets(updated);
    });
  }, [recalculatePinnedWidgets]);

  const updateWidgetPosition = useCallback((id: string, newPosition: { x: number; y: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => {
        if (widget.id === id && !widget.isPinned && !widget.isMaximized) {
          const clampedPos = clampPosition(
            newPosition.x,
            newPosition.y,
            widget.size.width,
            widget.size.height,
            mainContentArea
          );
          return { ...widget, position: clampedPos, normalPosition: clampedPos };
        }
        return widget;
      })
    );
  }, [mainContentArea]);

  const updateWidgetSize = useCallback((id: string, newSize: { width: number; height: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => {
        if (widget.id === id && !widget.isPinned && !widget.isMinimized && !widget.isMaximized) {
          const clampedPos = clampPosition(
            widget.position.x,
            widget.position.y,
            newSize.width,
            newSize.height,
            mainContentArea
          );
          return { ...widget, size: newSize, position: clampedPos, normalSize: newSize };
        }
        return widget;
      })
    );
  }, [mainContentArea]);

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
        if (widget.id === id && !widget.isPinned) {
          if (widget.isMaximized) {
            return {
              ...widget,
              isMaximized: false,
              isMinimized: false,
              position: widget.normalPosition || initialWidgetConfigs[id].initialPosition,
              size: widget.normalSize || { width: initialWidgetConfigs[id].initialWidth, height: initialWidgetConfigs[id].initialHeight },
            };
          } else if (widget.isMinimized) {
            return {
              ...widget,
              isMinimized: false,
              position: widget.normalPosition || initialWidgetConfigs[id].initialPosition,
              size: widget.normalSize || { width: initialWidgetConfigs[id].initialWidth, height: initialWidgetConfigs[id].initialHeight },
            };
          } else {
            return {
              ...widget,
              isMinimized: true,
              normalSize: widget.size,
              normalPosition: widget.position,
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
      return recalculatePinnedWidgets(updatedWidgets);
    });
  }, [initialWidgetConfigs, recalculatePinnedWidgets, mainContentArea]);

  const maximizeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id && !widget.isPinned) {
          if (widget.isMaximized) {
            return {
              ...widget,
              isMaximized: false,
              isMinimized: false,
              position: widget.normalPosition || initialWidgetConfigs[id].initialPosition,
              size: widget.normalSize || { width: initialWidgetConfigs[id].initialWidth, height: initialWidgetConfigs[id].initialHeight },
            };
          } else {
            return {
              ...widget,
              isMaximized: true,
              isMinimized: false,
              normalSize: widget.size,
              normalPosition: widget.position,
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

  const togglePinned = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id) {
          if (widget.isPinned) {
            const config = initialWidgetConfigs[id];
            return {
              ...widget,
              isPinned: false,
              isMinimized: false,
              isMaximized: false,
              position: widget.previousPosition || clampPosition(config.initialPosition.x, config.initialPosition.y, config.initialWidth, config.initialHeight, mainContentArea),
              size: widget.previousSize || { width: config.initialWidth, height: config.initialHeight },
              previousPosition: undefined,
              previousSize: undefined,
            };
          } else {
            return {
              ...widget,
              isPinned: true,
              isMinimized: true,
              isMaximized: false,
              previousPosition: widget.position,
              previousSize: widget.size,
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
      closeWidget(id);
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
      maximizeWidget,
      togglePinned,
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