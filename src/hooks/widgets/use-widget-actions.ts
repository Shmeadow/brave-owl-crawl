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
} from './types'; // Corrected import path

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

  const recalculatePinnedWidgets = useCallback((currentWidgets: WidgetState[]) => {
    const pinned = currentWidgets.filter((w: WidgetState) => w.isPinned).sort((a, b) => a.id.localeCompare(b.id));
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

  const addWidget = useCallback((id: string, title: string) => {
    if (!activeWidgets.some((widget: WidgetState) => widget.id === id)) {
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
  }, [activeWidgets, initialWidgetConfigs, maxZIndex, mainContentArea, setActiveWidgets]);

  const removeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updated = prev.filter((widget: WidgetState) => widget.id !== id);
      return recalculatePinnedWidgets(updated);
    });
  }, [setActiveWidgets, recalculatePinnedWidgets]);

  const updateWidgetPosition = useCallback((id: string, newPosition: { x: number; y: number }) => {
    setActiveWidgets(prev =>
      prev.map((widget: WidgetState) => {
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
  }, [mainContentArea, setActiveWidgets]);

  const updateWidgetSize = useCallback((id: string, newSize: { width: number; height: number }) => {
    setActiveWidgets(prev =>
      prev.map((widget: WidgetState) => {
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
  }, [mainContentArea, setActiveWidgets]);

  const bringWidgetToFront = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const newMaxZIndex = maxZIndex + 1;
      setMaxZIndex(newMaxZIndex);
      return prev.map((widget: WidgetState) =>
        widget.id === id ? { ...widget, zIndex: newMaxZIndex } : widget
      );
    });
  }, [maxZIndex, setActiveWidgets]);

  const minimizeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map((widget: WidgetState) => {
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
  }, [mainContentArea, setActiveWidgets, recalculatePinnedWidgets]);

  const maximizeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map((widget: WidgetState) => {
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
  }, [mainContentArea, setActiveWidgets, recalculatePinnedWidgets]);

  const togglePinned = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.map((widget: WidgetState) => {
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
  }, [initialWidgetConfigs, setActiveWidgets, recalculatePinnedWidgets]);

  const closeWidget = useCallback((id: string) => {
    removeWidget(id);
  }, [removeWidget]);

  const toggleWidget = useCallback((id: string, title: string) => {
    if (activeWidgets.some((widget: WidgetState) => widget.id === id)) {
      closeWidget(id);
    } else {
      addWidget(id, title);
    }
  }, [activeWidgets, addWidget, closeWidget]);

  const topmostZIndex = useMemo(() => {
    const visibleWidgets = activeWidgets.filter((w: WidgetState) => !w.isMinimized && !w.isMaximized && !w.isPinned);
    if (visibleWidgets.length === 0) return 0;
    return Math.max(...visibleWidgets.map((w: WidgetState) => w.zIndex));
  }, [activeWidgets]);

  return {
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
    maxZIndex,
    setMaxZIndex,
  };
}