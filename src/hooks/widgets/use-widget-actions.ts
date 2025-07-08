"use client";

import { useState, useCallback, useMemo } from "react";
import {
  WidgetState,
  MainContentArea,
  WidgetConfig,
  clampPosition,
  DOCKED_WIDGET_WIDTH,
  DOCKED_WIDGET_HEIGHT,
  DOCKED_WIDGET_HORIZONTAL_GAP,
  BOTTOM_DOCK_OFFSET,
  MINIMIZED_WIDGET_WIDTH, // Import here
  MINIMIZED_WIDGET_HEIGHT, // Import here
} from './types'; // Corrected import path
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

  // Constants for initial placement near sidebar
  const SIDEBAR_OPEN_OFFSET_X = 80; // Distance from sidebar's left edge
  const SIDEBAR_OPEN_OFFSET_Y = 80; // Distance from header's top edge

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
      const updatedWidgets = prev.map((widget: WidgetState) => {
        if (widget.id === id) {
          if (widget.isPinned) {
            // It's pinned, unpin it and restore to normal position/size
            return {
              ...widget,
              isPinned: false,
              isMinimized: false, // Unpinning makes it normal
              isMaximized: false,
              isClosed: false, // Ensure visible
              position: widget.normalPosition || clampPosition(
                mainContentArea.left + SIDEBAR_OPEN_OFFSET_X, // Default to near sidebar if no normalPosition
                mainContentArea.top + SIDEBAR_OPEN_OFFSET_Y,
                initialWidgetConfigs[id].initialWidth,
                initialWidgetConfigs[id].initialHeight,
                mainContentArea
              ), // Restore or use initial
              size: widget.normalSize || { width: initialWidgetConfigs[id].initialWidth, height: initialWidgetConfigs[id].initialHeight }, // Restore or use initial
              previousPosition: undefined, // Clear previous state
              previousSize: undefined,
            };
          } else {
            // It's not pinned, pin it. Save current normal state.
            return {
              ...widget,
              isPinned: true,
              isMinimized: true, // Pinned widgets are always minimized
              isMaximized: false,
              isClosed: false, // Ensure visible
              normalPosition: widget.position, // Save current position as normal
              normalSize: widget.size, // Save current size as normal
            };
          }
        }
        return widget;
      });
      return updatedWidgets; // Recalculation happens in updateAndRecalculate
    });
  }, [initialWidgetConfigs, mainContentArea, updateAndRecalculate]);

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