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
  topmostZIndex: number;
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

const DOCKED_WIDGET_WIDTH = 192;
const DOCKED_WIDGET_HEIGHT = 48;
const DOCKED_WIDGET_HORIZONTAL_GAP = 4;
const BOTTOM_DOCK_OFFSET = 16;
const LOCAL_STORAGE_WIDGET_STATE_KEY = 'active_widget_states';

export const clampPosition = (x: number, y: number, width: number, height: number, bounds: { left: number; top: number; width: number; height: number }) => {
  const maxX = bounds.left + bounds.width - width;
  const maxY = bounds.top + bounds.height - height;
  const clampedX = Math.max(bounds.left, Math.min(x, maxX));
  const clampedY = Math.max(bounds.top, Math.min(y, maxY));
  return { x: clampedX, y: clampedY };
};

export function WidgetProvider({ children, initialWidgetConfigs, mainContentArea }: WidgetProviderProps) {
  const [activeWidgets, setActiveWidgets] = useState<WidgetState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(903); // Changed from 900 to 903
  const [mounted, setMounted] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_WIDGET_STATE_KEY);
        if (savedState) {
          const parsedState: WidgetState[] = JSON.parse(savedState);
          // Filter out any widgets that might not have a config anymore
          const validWidgets = parsedState.filter(w => initialWidgetConfigs[w.id]);
          // Re-clamp positions and sizes based on current mainContentArea
          const reClampedWidgets = validWidgets.map(widget => {
            const clampedPos = clampPosition(
              widget.position.x,
              widget.position.y,
              widget.size.width,
              widget.size.height,
              mainContentArea
            );
            return {
              ...widget,
              position: clampedPos,
              normalPosition: widget.normalPosition ? clampPosition(
                widget.normalPosition.x,
                widget.normalPosition.y,
                widget.normalSize?.width || initialWidgetConfigs[widget.id].initialWidth,
                widget.normalSize?.height || initialWidgetConfigs[widget.id].initialHeight,
                mainContentArea
              ) : clampedPos,
            };
          });
          setActiveWidgets(reClampedWidgets);
          const currentMaxZ = reClampedWidgets.length > 0 ? Math.max(...reClampedWidgets.map(w => w.zIndex)) : 903; // Changed from 900 to 903
          setMaxZIndex(currentMaxZ);
        }
      } catch (e) {
        console.error("Failed to parse widget states from local storage:", e);
        // Fallback to default if parsing fails
        setActiveWidgets([]);
      }
    }
  }, [initialWidgetConfigs, mainContentArea]); // Re-run if mainContentArea changes on initial load

  // Save state to local storage whenever activeWidgets changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_WIDGET_STATE_KEY, JSON.stringify(activeWidgets));
    }
  }, [activeWidgets, mounted]);

  const recalculatePinnedWidgets = useCallback((currentWidgets: WidgetState[]) => {
    const pinned = currentWidgets.filter(w => w.isPinned).sort((a, b) => a.id.localeCompare(b.id));
    let currentX = mainContentArea.left + DOCKED_WIDGET_HORIZONTAL_GAP;

    return currentWidgets.map(widget => {
      if (widget.isPinned) {
        const newPosition = {
          x: currentX,
          y: mainContentArea.top + mainContentArea.height - DOCKED_WIDGET_HEIGHT - BOTTOM_DOCK_OFFSET,
        };
        currentX += DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP;

        return {
          ...widget,
          position: newPosition,
          size: {
            width: DOCKED_WIDGET_WIDTH,
            height: DOCKED_WIDGET_HEIGHT,
          },
          isMinimized: true,
          isMaximized: false,
        };
      }
      return widget;
    });
  }, [mainContentArea]);

  useEffect(() => {
    setActiveWidgets(prevWidgets => {
      const updated = prevWidgets.map(widget => {
        if (!widget.isPinned && !widget.isMaximized) {
          const clampedPos = clampPosition(
            widget.position.x,
            widget.position.y,
            widget.size.width,
            widget.size.height,
            mainContentArea
          );
          if (clampedPos.x !== widget.position.x || clampedPos.y !== widget.position.y) {
            return { ...widget, position: clampedPos };
          }
        }
        return widget;
      });
      return recalculatePinnedWidgets(updated);
    });
  }, [mainContentArea, recalculatePinnedWidgets]);

  const addWidget = useCallback((id: string, title: string) => {
    if (!activeWidgets.some(widget => widget.id === id)) {
      const config = initialWidgetConfigs[id];
      if (config) {
        const newMaxZIndex = maxZIndex + 1;
        setMaxZIndex(newMaxZIndex);

        const offsetAmount = 20;
        const offsetIndex = activeWidgets.length % 5;
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
        if (widget.id === id) {
          if (widget.isMinimized) {
            // It's minimized, restore to normal
            return {
              ...widget,
              isMinimized: false,
              position: widget.normalPosition!,
              size: widget.normalSize!,
            };
          } else {
            // It's normal or maximized, so minimize it.
            const normalSizeToSave = widget.isMaximized ? widget.normalSize! : widget.size;
            const normalPositionToSave = widget.isMaximized ? widget.normalPosition! : widget.position;
            
            return {
              ...widget,
              isMinimized: true,
              isMaximized: false, // Ensure it's not maximized
              normalSize: normalSizeToSave,
              normalPosition: normalPositionToSave,
              size: { width: 224, height: 48 },
              position: clampPosition(
                normalPositionToSave.x,
                normalPositionToSave.y,
                224,
                48,
                mainContentArea
              ),
            };
          }
        }
        return widget;
      });
      return recalculatePinnedWidgets(updatedWidgets);
    });
  }, [mainContentArea, recalculatePinnedWidgets]);

  const maximizeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id) {
          if (widget.isMaximized) {
            // It's maximized, restore to normal
            return {
              ...widget,
              isMaximized: false,
              position: widget.normalPosition!,
              size: widget.normalSize!,
            };
          } else {
            // It's normal or minimized, so maximize it.
            // First, ensure we have the correct "normal" state to save.
            const normalSizeToSave = widget.isMinimized ? widget.normalSize! : widget.size;
            const normalPositionToSave = widget.isMinimized ? widget.normalPosition! : widget.position;

            return {
              ...widget,
              isMaximized: true,
              isMinimized: false, // Ensure it's not minimized
              isPinned: false, // Maximizing unpins it
              normalSize: normalSizeToSave,
              normalPosition: normalPositionToSave,
              size: { width: mainContentArea.width, height: mainContentArea.height },
              position: { x: mainContentArea.left, y: mainContentArea.top },
            };
          }
        }
        return widget;
      });
      return recalculatePinnedWidgets(updatedWidgets);
    });
  }, [mainContentArea, recalculatePinnedWidgets]);

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
              position: widget.previousPosition!,
              size: widget.previousSize!,
              previousPosition: undefined,
              previousSize: undefined,
            };
          } else {
            return {
              ...widget,
              isPinned: true,
              isMinimized: true,
              isMaximized: false,
              previousPosition: widget.normalPosition!,
              previousSize: widget.normalSize!,
            };
          }
        }
        return widget;
      });
      return recalculatePinnedWidgets(updatedWidgets);
    });
  }, [initialWidgetConfigs, recalculatePinnedWidgets]);

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

  const topmostZIndex = useMemo(() => {
    const visibleWidgets = activeWidgets.filter(w => !w.isMinimized && !w.isMaximized && !w.isPinned);
    if (visibleWidgets.length === 0) return 0;
    return Math.max(...visibleWidgets.map(w => w.zIndex));
  }, [activeWidgets]);

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
      topmostZIndex,
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
      topmostZIndex,
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