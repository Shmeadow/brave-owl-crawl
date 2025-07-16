"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  WidgetState,
  MainContentArea,
  WidgetConfig,
  clampPosition,
  DOCKED_WIDGET_WIDTH,
  DOCKED_WIDGET_HEIGHT,
  DOCKED_WIDGET_HORIZONTAL_GAP,
  BOTTOM_DOCK_OFFSET,
  MINIMIZED_WIDGET_WIDTH,
  MINIMIZED_WIDGET_HEIGHT,
  SIDEBAR_OPEN_OFFSET_X,
  SIDEBAR_OPEN_OFFSET_Y,
} from './types';
import { useSidebar } from "@/components/sidebar/sidebar-context";

interface UseWidgetActionsProps {
  activeWidgets: WidgetState[];
  setActiveWidgets: React.Dispatch<React.SetStateAction<WidgetState[]>>;
  initialWidgetConfigs: { [key: string]: WidgetConfig };
  mainContentArea: MainContentArea;
}

export function useWidgetActions({
  activeWidgets,
  setActiveWidgets,
  initialWidgetConfigs,
  mainContentArea,
}: UseWidgetActionsProps) {
  const [maxZIndex, setMaxZIndex] = useState(903); // Initial z-index for new widgets
  const { activePanel, setActivePanel } = useSidebar();

  // This effect will run whenever the main content area changes (e.g., sidebar toggles).
  // It ensures that any maximized widget is resized to fit the new available space.
  useEffect(() => {
    // Don't run if the area is not calculated yet
    if (mainContentArea.width === 0 || mainContentArea.height === 0) {
      return;
    }

    // Use the functional form of setActiveWidgets to get the latest state
    // without needing activeWidgets in the dependency array, preventing loops.
    setActiveWidgets(prevWidgets => {
      const hasMaximizedWidget = prevWidgets.some(w => w.isMaximized);
      if (!hasMaximizedWidget) {
        return prevWidgets; // No change needed if no widgets are maximized
      }

      // If there is a maximized widget, update its dimensions
      return prevWidgets.map(widget => {
        if (widget.isMaximized) {
          return {
            ...widget,
            position: { x: mainContentArea.left, y: mainContentArea.top },
            size: { width: mainContentArea.width, height: mainContentArea.height },
          };
        }
        return widget;
      });
    });
  }, [mainContentArea, setActiveWidgets]); // Dependency on mainContentArea is key

  // This function is now primarily for calculating the *target* position for pinned widgets
  // within the conceptual dock area, even if they are rendered by a separate component.
  const recalculatePinnedWidgets = useCallback((currentWidgets: WidgetState[]) => {
    let currentX = mainContentArea.left + DOCKED_WIDGET_HORIZONTAL_GAP;

    return currentWidgets.map((widget: WidgetState) => {
      if (widget.isPinned) {
        const newPosition = {
          x: currentX,
          y: mainContentArea.top + mainContentArea.height - DOCKED_WIDGET_HEIGHT - BOTTOM_DOCK_OFFSET,
        };
        currentX += DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP;

        return {
          ...widget,
          position: newPosition, // This is the calculated position for persistence
          size: {
            width: DOCKED_WIDGET_WIDTH,
            height: DOCKED_WIDGET_HEIGHT,
          },
          isMinimized: true, // Pinned widgets are always minimized
          isMaximized: false,
          isClosed: false, // Pinned widgets are always visible
        };
      }
      return widget;
    });
  }, [mainContentArea]);

  const updateAndRecalculate = useCallback((updater: (prev: WidgetState[]) => WidgetState[]) => {
    setActiveWidgets(prev => {
      const updated = updater(prev);
      return recalculatePinnedWidgets(updated);
    });
  }, [setActiveWidgets, recalculatePinnedWidgets]);


  const addWidget = useCallback((id: string, title: string) => {
    updateAndRecalculate(prev => {
      const existingWidget = prev.find((widget: WidgetState) => widget.id === id);
      const config = initialWidgetConfigs[id];

      if (!config) {
        console.error(`Widget config not found for ID: ${id}`);
        return prev;
      }

      const newMaxZIndex = maxZIndex + 1;
      setMaxZIndex(newMaxZIndex);

      if (existingWidget) {
        // If widget exists, just make it visible and bring to front
        const restoredPosition = existingWidget.normalPosition || clampPosition(
          mainContentArea.left + SIDEBAR_OPEN_OFFSET_X, // Default to near sidebar if no normalPosition
          mainContentArea.top + SIDEBAR_OPEN_OFFSET_Y,
          config.initialWidth,
          config.initialHeight,
          mainContentArea
        );
        const restoredSize = existingWidget.normalSize || { width: config.initialWidth, height: config.initialHeight };

        const updatedWidgets = prev.map((widget: WidgetState) =>
          widget.id === id
            ? {
                ...widget,
                isClosed: false,
                isMinimized: false,
                isMaximized: false,
                isPinned: false,
                zIndex: newMaxZIndex,
                position: restoredPosition,
                size: restoredSize,
              }
            : widget
        );
        return updatedWidgets; // Recalculation happens in updateAndRecalculate
      } else {
        // If widget does not exist (shouldn't happen with new persistence model, but as fallback)
        const initialX = mainContentArea.left + SIDEBAR_OPEN_OFFSET_X;
        const initialY = mainContentArea.top + SIDEBAR_OPEN_OFFSET_Y;

        const clampedInitialPos = clampPosition(
          initialX,
          initialY,
          config.initialWidth,
          config.initialHeight,
          mainContentArea
        );

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
            isClosed: false, // New widgets are open by default
            normalSize: { width: config.initialWidth, height: config.initialHeight },
            normalPosition: clampedInitialPos,
          },
        ];
        return newWidgets; // Recalculation happens in updateAndRecalculate
      }
    });
  }, [initialWidgetConfigs, maxZIndex, mainContentArea, updateAndRecalculate]);

  const removeWidget = useCallback((id: string) => {
    // "Remove" now means setting isClosed to true
    updateAndRecalculate(prev => {
      const updated = prev.map((widget: WidgetState) =>
        widget.id === id ? { ...widget, isClosed: true, isMinimized: false, isMaximized: false, isPinned: false } : widget
      );
      return updated; // Recalculation happens in updateAndRecalculate
    });
  }, [updateAndRecalculate]);

  const updateWidgetPosition = useCallback((id: string, newPosition: { x: number; y: number }) => {
    setActiveWidgets(prev =>
      prev.map((widget: WidgetState) => {
        if (widget.id === id && !widget.isPinned && !widget.isMaximized && !widget.isClosed) {
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
  }, [mainContentArea, setActiveWidgets]);

  const updateWidgetSize = useCallback((id: string, newSize: { width: number; height: number }) => {
    setActiveWidgets(prev =>
      prev.map((widget: WidgetState) => {
        if (widget.id === id && !widget.isPinned && !widget.isMinimized && !widget.isMaximized && !widget.isClosed) {
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
  }, [mainContentArea, setActiveWidgets]);

  const bringWidgetToFront = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const newMaxZIndex = maxZIndex + 1;
      setMaxZIndex(newMaxZIndex);
      return prev.map((widget: WidgetState) =>
        widget.id === id ? { ...widget, zIndex: newMaxZIndex, isClosed: false } : widget // Ensure visible when brought to front
      );
    });
  }, [maxZIndex, setActiveWidgets]);

  const maximizeWidget = useCallback((id: string) => {
    updateAndRecalculate(prev => {
      const updatedWidgets = prev.map((widget: WidgetState) => {
        if (widget.id === id) {
          if (widget.isMaximized) {
            // It's maximized, restore to normal
            return {
              ...widget,
              isMaximized: false,
              isClosed: false, // Ensure visible
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
              isClosed: false, // Ensure visible
              normalSize: normalSizeToSave,
              normalPosition: normalPositionToSave,
              size: { width: mainContentArea.width, height: mainContentArea.height },
              position: { x: mainContentArea.left, y: mainContentArea.top },
            };
          }
        }
        return widget;
      });
      return updatedWidgets; // Recalculation happens in updateAndRecalculate
    });
  }, [mainContentArea, updateAndRecalculate]);

  const togglePinned = useCallback((id: string) => {
    updateAndRecalculate(prev => {
      return prev.map((widget: WidgetState) => {
        if (widget.id === id) {
          if (widget.isPinned) {
            // UNPINNING: Restore from the state saved before pinning.
            return {
              ...widget,
              isPinned: false,
              isMinimized: false, // Unpinning always restores to a non-minimized state for now.
              position: widget.previousPosition!,
              size: widget.previousSize!,
              // Infer if it was maximized based on the restored size.
              isMaximized: widget.previousSize?.width === mainContentArea.width && widget.previousSize?.height === mainContentArea.height,
              previousPosition: undefined, // Clear the previous state
              previousSize: undefined, // Clear the previous state
            };
          } else {
            // PINNING: Save the current state before changing it.
            return {
              ...widget,
              isPinned: true,
              isMinimized: true,  // Pinned state is a form of minimized state.
              isMaximized: false, // A pinned widget is never maximized.
              previousPosition: widget.position, // Save current position
              previousSize: widget.size,       // Save current size
              // Importantly, we DO NOT touch normalPosition or normalSize here.
              // They hold the state for un-maximizing.
            };
          }
        }
        return widget;
      });
    });
  }, [mainContentArea, updateAndRecalculate]);

  const closeWidget = useCallback((id: string) => {
    if (id === activePanel) {
      setActivePanel('spaces'); // Or some other default panel
    }
    updateAndRecalculate(prev => {
      const updated = prev.map((widget: WidgetState) =>
        widget.id === id ? { ...widget, isClosed: true, isMinimized: false, isMaximized: false, isPinned: false } : widget
      );
      return updated; // Recalculation happens in updateAndRecalculate
    });
  }, [updateAndRecalculate, activePanel, setActivePanel]);

  const toggleWidget = useCallback((id: string, title: string) => {
    updateAndRecalculate(prev => {
      const existingWidget = prev.find((widget: WidgetState) => widget.id === id);
      const config = initialWidgetConfigs[id];

      if (!config) {
        console.error(`Widget config not found for ID: ${id}`);
        return prev;
      }

      const newMaxZIndex = maxZIndex + 1;
      setMaxZIndex(newMaxZIndex);

      if (existingWidget) {
        // Toggle visibility
        const updatedWidgets = prev.map((widget: WidgetState) => {
          if (widget.id === id) {
            if (widget.isClosed) {
              // Open it
              const restoredPosition = widget.normalPosition || clampPosition(
                mainContentArea.left + SIDEBAR_OPEN_OFFSET_X, // Default to near sidebar if no normalPosition
                mainContentArea.top + SIDEBAR_OPEN_OFFSET_Y,
                config.initialWidth,
                config.initialHeight,
                mainContentArea
              );
              const restoredSize = widget.normalSize || { width: config.initialWidth, height: config.initialHeight };
              return {
                ...widget,
                isClosed: false,
                isMinimized: false,
                isMaximized: false,
                isPinned: false,
                zIndex: newMaxZIndex,
                position: restoredPosition,
                size: restoredSize,
              };
            } else {
              // Close it
              return {
                ...widget,
                isClosed: true,
                isMinimized: false, // Reset other states when closing
                isMaximized: false,
                isPinned: false,
              };
            }
          }
          return widget;
        });
        return updatedWidgets; // Recalculation happens in updateAndRecalculate
      } else {
        // This case should ideally not happen if all widgets are pre-initialized in persistence.
        // But as a fallback, add it as a new, open widget.
        const initialX = mainContentArea.left + SIDEBAR_OPEN_OFFSET_X;
        const initialY = mainContentArea.top + SIDEBAR_OPEN_OFFSET_Y;

        const clampedInitialPos = clampPosition(
          initialX,
          initialY,
          config.initialWidth,
          config.initialHeight,
          mainContentArea
        );

        const newWidget: WidgetState = {
          id,
          title,
          position: clampedInitialPos,
          size: { width: config.initialWidth, height: config.initialHeight },
          zIndex: newMaxZIndex,
          isMinimized: false,
          isMaximized: false,
          isPinned: false,
          isClosed: false,
          normalSize: { width: config.initialWidth, height: config.initialHeight },
          normalPosition: clampedInitialPos,
        };
        return [...prev, newWidget]; // Recalculation happens in updateAndRecalculate
      }
    });
  }, [activeWidgets, initialWidgetConfigs, maxZIndex, mainContentArea, updateAndRecalculate]);


  const topmostZIndex = useMemo(() => {
    const visibleWidgets = activeWidgets.filter((w: WidgetState) => !w.isMinimized && !w.isMaximized && !w.isPinned && !w.isClosed);
    if (visibleWidgets.length === 0) return 0;
    return Math.max(...visibleWidgets.map((w: WidgetState) => w.zIndex));
  }, [activeWidgets]);

  return {
    addWidget,
    removeWidget,
    updateWidgetPosition,
    updateWidgetSize,
    bringWidgetToFront,
    maximizeWidget,
    togglePinned,
    closeWidget,
    toggleWidget,
    topmostZIndex,
    maxZIndex,
    setMaxZIndex,
  };
}