"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

interface WidgetState {
  id: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

interface WidgetContextType {
  activeWidgets: WidgetState[];
  openWidget: (id: string, title: string) => void;
  closeWidget: (id: string) => void;
  minimizeWidget: (id: string) => void;
  maximizeWidget: (id: string) => void;
  togglePinned: (id: string) => void;
  updateWidgetPosition: (id: string, newPosition: { x: number; y: number }) => void;
  updateWidgetSize: (id: string, newSize: { width: number; height: number }) => void;
  bringWidgetToFront: (id: string) => void;
  updateWidgetPositionFromDrag: (id: string, delta: { x: number; y: number }) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000); // Start z-index high

  const openWidget = useCallback((id: string, title: string) => {
    setWidgets(prevWidgets => {
      const existingWidget = prevWidgets.find(w => w.id === id);
      if (existingWidget) {
        // If exists, bring to front and ensure not minimized/maximized/pinned
        return prevWidgets.map(w =>
          w.id === id
            ? { ...w, isMinimized: false, isMaximized: false, isPinned: false, zIndex: nextZIndex }
            : w
        );
      } else {
        // Add new widget
        const newWidget: WidgetState = {
          id,
          title,
          isMinimized: false,
          isMaximized: false,
          isPinned: false,
          position: { x: Math.random() * 200 + 100, y: Math.random() * 100 + 100 }, // Random initial position
          size: { width: 400, height: 300 },
          zIndex: nextZIndex,
        };
        return [...prevWidgets, newWidget];
      }
    });
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const closeWidget = useCallback((id: string) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
  }, []);

  const minimizeWidget = useCallback((id: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === id
          ? { ...widget, isMinimized: !widget.isMinimized, isMaximized: false, isPinned: false }
          : widget
      )
    );
  }, []);

  const maximizeWidget = useCallback((id: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === id
          ? { ...widget, isMaximized: !widget.isMaximized, isMinimized: false, isPinned: false, zIndex: nextZIndex }
          : widget
      )
    );
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const togglePinned = useCallback((id: string) => {
    setWidgets(prevWidgets => {
      const widgetToToggle = prevWidgets.find(w => w.id === id);
      if (!widgetToToggle) return prevWidgets;

      const newIsPinned = !widgetToToggle.isPinned;

      // If pinning, ensure it's not minimized or maximized
      // If unpinning, ensure it's not minimized or maximized (it will become a normal floating widget)
      return prevWidgets.map(w =>
        w.id === id
          ? { ...w, isPinned: newIsPinned, isMinimized: false, isMaximized: false, zIndex: nextZIndex }
          : w
      );
    });
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const updateWidgetPosition = useCallback((id: string, newPosition: { x: number; y: number }) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === id ? { ...widget, position: newPosition } : widget
      )
    );
  }, []);

  const updateWidgetPositionFromDrag = useCallback((id: string, delta: { x: number; y: number }) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget => {
        if (widget.id === id) {
          return {
            ...widget,
            position: {
              x: widget.position.x + delta.x,
              y: widget.position.y + delta.y,
            },
          };
        }
        return widget;
      })
    );
  }, []);


  const updateWidgetSize = useCallback((id: string, newSize: { width: number; height: number }) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === id ? { ...widget, size: newSize } : widget
      )
    );
  }, []);

  const bringWidgetToFront = useCallback((id: string) => {
    setWidgets(prevWidgets => {
      const widgetToFront = prevWidgets.find(w => w.id === id);
      if (!widgetToFront || widgetToFront.zIndex === nextZIndex - 1) {
        return prevWidgets; // Already at front or not found
      }
      const updatedWidgets = prevWidgets.map(w =>
        w.id === id ? { ...w, zIndex: nextZIndex } : w
      );
      setNextZIndex(prev => prev + 1);
      return updatedWidgets;
    });
  }, [nextZIndex]);

  // Calculate positions for pinned widgets
  const activeWidgetsWithPinnedPositions = widgets.map(widget => {
    if (widget.isPinned) {
      // Find index of this pinned widget among all pinned widgets
      const pinnedWidgets = widgets.filter(w => w.isPinned).sort((a, b) => a.zIndex - b.zIndex); // Sort by zIndex to maintain order
      const index = pinnedWidgets.findIndex(w => w.id === widget.id);
      const PinnedWidgetWidth = 192; // Defined in widget.tsx
      const PinnedWidgetHeight = 48; // Defined in widget.tsx
      const padding = 8; // Some padding between widgets and from the edge

      // Stack from bottom-left, moving right
      const x = padding + index * (PinnedWidgetWidth + padding);
      const y = window.innerHeight - PinnedWidgetHeight - padding; // Position at bottom

      return {
        ...widget,
        position: { x, y },
        zIndex: 990 + index, // Pinned widgets have a specific z-index range
      };
    }
    return widget;
  });

  return (
    <WidgetContext.Provider
      value={{
        activeWidgets: activeWidgetsWithPinnedPositions,
        openWidget,
        closeWidget,
        minimizeWidget,
        maximizeWidget,
        togglePinned,
        updateWidgetPosition,
        updateWidgetSize,
        bringWidgetToFront,
        updateWidgetPositionFromDrag,
      }}
    >
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