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
  DEFAULT_WIDGET_WIDTH_MOBILE, // Import new constants
  DEFAULT_WIDGET_HEIGHT_MOBILE, // Import new constants
} from './types';
import { useSidebar } from "@/components/sidebar/sidebar-context";

interface UseWidgetActionsProps {
  activeWidgets: WidgetState[];
  setActiveWidgets: React.Dispatch<React.SetStateAction<WidgetState[]>>;
  initialWidgetConfigs: { [key: string]: WidgetConfig };
  mainContentArea: MainContentArea;
  isMobile: boolean; // New prop
}

export function useWidgetActions({
  activeWidgets,
  setActiveWidgets,
  initialWidgetConfigs,
  mainContentArea,
  isMobile, // Destructure new prop
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

      // Determine effective initial size based on mobile status
      const effectiveInitialWidth = isMobile ? DEFAULT_WIDGET_WIDTH_MOBILE : config.initialWidth;
      const effectiveInitialHeight = isMobile ? DEFAULT_WIDGET_HEIGHT_MOBILE : config.initialHeight;

      // Determine effective initial position based on mobile status
      const effectiveInitialX = isMobile ? mainContentArea.left + (mainContentArea.width - effectiveInitialWidth) / 2 : mainContentArea.left + SIDEBAR_OPEN_OFFSET_X;
      const effectiveInitialY = isMobile ? mainContentArea.top + 20 : mainContentArea.top + SIDEBAR_OPEN_OFFSET_Y;

      if (existingWidget) {
        // If widget exists, just make it visible and bring to front
        const restoredPosition = existingWidget.normalPosition || clampPosition(
          effectiveInitialX, // Use effective X for clamping
          effectiveInitialY, // Use effective Y for clamping
          effectiveInitialWidth,
          effectiveInitialHeight,
          mainContentArea
        );
        const restoredSize = existingWidget.normalSize || { width: effectiveInitialWidth, height: effectiveInitialHeight };

        // Ensure restored size is not larger than mainContentArea
        const clampedRestoredSize = { ...restoredSize };
        if (clampedRestoredSize.width > mainContentArea.width) clampedRestoredSize.width = mainContentArea.width;
        if (clampedRestoredSize.height > mainContentArea.height) clampedRestoredSize.height = mainContentArea.height;

        const clampedRestoredPosition = clampPosition(restoredPosition.x, restoredPosition.y, clampedRestoredSize.width, clampedRestoredSize.height, mainContentArea);

        const updatedWidgets = prev.map((widget: WidgetState) =>
          widget.id === id
            ? {
                ...widget,
                isClosed: false,
                isMinimized: false,
                isPinned: false,
                zIndex: newMaxZIndex,
                position: clampedRestoredPosition,
                size: clampedRestoredSize,
                isMaximized: clampedRestoredSize.width === mainContentArea.width && clampedRestoredSize.height === mainContentArea.height,
              }
            : widget
        );
        return updatedWidgets; // Recalculation happens in updateAndRecalculate
      } else {
        // If widget does not exist (shouldn't happen with new persistence model, but as fallback)
        const clampedInitialPos = clampPosition(
          effectiveInitialX,
          effectiveInitialY,
          effectiveInitialWidth,
          effectiveInitialHeight,
          mainContentArea
        );

        const newWidgets = [
          ...prev,
          {
            id,
            title,
            position: clampedInitialPos,
            size: { width: effectiveInitialWidth, height: effectiveInitialHeight },
            zIndex: newMaxZIndex,
            isMinimized: false,
            isMaximized: false,
            isPinned: false,
            isClosed: false, // New widgets are open by default
            normalSize: { width: effectiveInitialWidth, height: effectiveInitialHeight },
            normalPosition: clampedInitialPos,
          },
        ];
        return newWidgets; // Recalculation happens in updateAndRecalculate
      }
    });
  }, [initialWidgetConfigs, maxZIndex, mainContentArea, updateAndRecalculate, isMobile]);

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
          // Clamp the new position to ensure it stays within bounds
          const clampedPosition = clampPosition(
            newPosition.x,
            newPosition.y,
            widget.size.width, // Use current widget size for clamping
            widget.size.height, // Use current widget size for clamping
            mainContentArea
          );
          return { ...widget, position: clampedPosition, normalPosition: clampedPosition };
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
            const restoredSize = { ...widget.normalSize! };
            if (restoredSize.width > mainContentArea.width) restoredSize.width = mainContentArea.width;
            if (restoredSize.height > mainContentArea.height) restoredSize.height = mainContentArea.height;
            const restoredPosition = clampPosition(widget.normalPosition!.x, widget.normalPosition!.y, restoredSize.width, restoredSize.height, mainContentArea);

            return {
              ...widget,
              isMaximized: false,
              isClosed: false, // Ensure visible
              position: restoredPosition,
              size: restoredSize,
              // Infer if it was maximized based on the restored size.
              isMaximized: restoredSize.width === mainContentArea.width && restoredSize.height === mainContentArea.height,
              previousPosition: undefined, // Clear the previous state
              previousSize: undefined, // Clear the previous state
            };
          } else {
            // It's normal or minimized, so maximize it.
            // First, ensure we have the correct "normal" state to save.
            const normalSizeToSave = widget.isMinimized ? widget.normalSize! : widget.size;
            const normalPositionToSave = widget.isMinimized ? widget.normalPosition! : widget.position;

            // Clamp these before saving them as normal state
            const clampedNormalSize = { ...normalSizeToSave };
            if (clampedNormalSize.width > mainContentArea.width) clampedNormalSize.width = mainContentArea.width;
            if (clampedNormalSize.height > mainContentArea.height) clampedNormalSize.height = mainContentArea.height;
            const clampedNormalPosition = clampPosition(normalPositionToSave.x, normalPositionToSave.y, clampedNormalSize.width, clampedNormalSize.height, mainContentArea);

            return {
              ...widget,
              isMaximized: true,
              isMinimized: false, // Ensure it's not minimized
              isPinned: false, // Maximizing unpins it
              isClosed: false, // Ensure visible
              normalSize: clampedNormalSize,
              normalPosition: clampedNormalPosition,
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
            const restoredSize = { ...widget.previousSize! };
            if (restoredSize.width > mainContentArea.width) restoredSize.width = mainContentArea.width;
            if (restoredSize.height > mainContentArea.height) restoredSize.height = mainContentArea.height;
            const restoredPosition = clampPosition(widget.previousPosition!.x, widget.previousPosition!.y, restoredSize.width, restoredSize.height, mainContentArea);

            return {
              ...widget,
              isPinned: false,
              isMinimized: false, // Unpinning always restores to a non-minimized state for now.
              position: restoredPosition,
              size: restoredSize,
              // Infer if it was maximized based on the restored size.
              isMaximized: restoredSize.width === mainContentArea.width && restoredSize.height === mainContentArea.height,
              previousPosition: undefined, // Clear the previous state
              previousSize: undefined, // Clear the previous state
            };
          } else {
            // PINNING: Save the current state before changing it.
            const previousPositionToSave = widget.position;
            const previousSizeToSave = widget.size;
            // Clamp these before saving them as previous state
            const clampedPreviousSize = { ...previousSizeToSave };
            if (clampedPreviousSize.width > mainContentArea.width) clampedPreviousSize.width = mainContentArea.width;
            if (clampedPreviousSize.height > mainContentArea.height) clampedPreviousSize.height = mainContentArea.height;
            const clampedPreviousPosition = clampPosition(previousPositionToSave.x, previousPositionToSave.y, clampedPreviousSize.width, clampedPreviousSize.height, mainContentArea);

            return {
              ...widget,
              isPinned: true,
              isMinimized: true,  // Pinned state is a form of minimized state.
              isMaximized: false, // A pinned widget is never maximized.
              previousPosition: clampedPreviousPosition, // Save current position
              previousSize: clampedPreviousSize,       // Save current size
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

      // Determine effective initial size based on mobile status
      const effectiveInitialWidth = isMobile ? DEFAULT_WIDGET_WIDTH_MOBILE : config.initialWidth;
      const effectiveInitialHeight = isMobile ? DEFAULT_WIDGET_HEIGHT_MOBILE : config.initialHeight;

      // Determine effective initial position based on mobile status
      const effectiveInitialX = isMobile ? mainContentArea.left + (mainContentArea.width - effectiveInitialWidth) / 2 : mainContentArea.left + SIDEBAR_OPEN_OFFSET_X;
      const effectiveInitialY = isMobile ? mainContentArea.top + 20 : mainContentArea.top + SIDEBAR_OPEN_OFFSET_Y;

      if (existingWidget) {
        // Toggle visibility
        const updatedWidgets = prev.map((widget: WidgetState) => {
          if (widget.id === id) {
            if (widget.isClosed) {
              // Open it
              const restoredSize = widget.normalSize || { width: effectiveInitialWidth, height: effectiveInitialHeight };
              // Ensure restored size is not larger than mainContentArea
              if (restoredSize.width > mainContentArea.width) restoredSize.width = mainContentArea.width;
              if (restoredSize.height > mainContentArea.height) restoredSize.height = mainContentArea.height;
              const restoredPosition = widget.normalPosition || clampPosition(
                effectiveInitialX, // Use effective X for clamping
                effectiveInitialY, // Use effective Y for clamping
                restoredSize.width,
                restoredSize.height,
                mainContentArea
              );

              // Destructure isMaximized from widget to avoid duplicate property error
              const { isMaximized: _oldIsMaximized, ...restOfWidget } = widget;

              return {
                ...restOfWidget, // Spread the rest of the widget properties
                isClosed: false,
                isMinimized: false,
                isPinned: false,
                zIndex: newMaxZIndex,
                position: clampPosition(restoredPosition.x, restoredPosition.y, restoredSize.width, restoredSize.height, mainContentArea), // Re-clamp position
                size: restoredSize,
                isMaximized: restoredSize.width === mainContentArea.width && restoredSize.height === mainContentArea.height, // Set based on condition
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
        const clampedInitialPos = clampPosition(
          effectiveInitialX,
          effectiveInitialY,
          effectiveInitialWidth,
          effectiveInitialHeight,
          mainContentArea
        );

        const newWidget: WidgetState = {
          id,
          title,
          position: clampedInitialPos,
          size: { width: effectiveInitialWidth, height: effectiveInitialHeight },
          zIndex: newMaxZIndex,
          isMinimized: false,
          isMaximized: false,
          isPinned: false,
          isClosed: false,
          normalSize: { width: effectiveInitialWidth, height: effectiveInitialHeight },
          normalPosition: clampedInitialPos,
        };
        return [...prev, newWidget]; // Recalculation happens in updateAndRecalculate
      }
    });
  }, [activeWidgets, initialWidgetConfigs, maxZIndex, mainContentArea, updateAndRecalculate, isMobile]);


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