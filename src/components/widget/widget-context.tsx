"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

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
  toggleWidget: (id: string, title: string) => void; // Added toggleWidget
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

interface WidgetProviderProps {
  children: React.ReactNode;
  initialWidgetConfigs: { [key: string]: WidgetConfig };
}

export function WidgetProvider({ children, initialWidgetConfigs }: WidgetProviderProps) {
  const [activeWidgets, setActiveWidgets] = useState<WidgetState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1000);

  const addWidget = useCallback((id: string, title: string) => {
    if (!activeWidgets.some(widget => widget.id === id)) {
      const config = initialWidgetConfigs[id];
      if (config) {
        setActiveWidgets(prev => [
          ...prev,
          {
            id,
            title,
            position: config.initialPosition,
            size: { width: config.initialWidth, height: config.initialHeight },
            zIndex: maxZIndex + 1,
            isMinimized: false,
            isDocked: false,
          },
        ]);
        setMaxZIndex(prev => prev + 1);
      }
    }
  }, [activeWidgets, initialWidgetConfigs, maxZIndex]);

  const removeWidget = useCallback((id: string) => {
    setActiveWidgets(prev => prev.filter(widget => widget.id !== id));
  }, []);

  const updateWidgetPosition = useCallback((id: string, newPosition: { x: number; y: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => (widget.id === id ? { ...widget, position: newPosition } : widget))
    );
  }, []);

  const updateWidgetSize = useCallback((id: string, newSize: { width: number; height: number }) => {
    setActiveWidgets(prev =>
      prev.map(widget => (widget.id === id ? { ...widget, size: newSize } : widget))
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
    setActiveWidgets(prev =>
      prev.map(widget => (widget.id === id ? { ...widget, isMinimized: !widget.isMinimized } : widget))
    );
  }, []);

  const closeWidget = useCallback((id: string) => {
    removeWidget(id);
  }, [removeWidget]);

  const toggleDocked = useCallback((id: string) => {
    setActiveWidgets(prev =>
      prev.map(widget => (widget.id === id ? { ...widget, isDocked: !widget.isDocked, isMinimized: false } : widget))
    );
  }, []);

  // New toggleWidget function
  const toggleWidget = useCallback((id: string, title: string) => {
    if (activeWidgets.some(widget => widget.id === id)) {
      removeWidget(id);
    } else {
      addWidget(id, title);
    }
  }, [activeWidgets, addWidget, removeWidget]);

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
      toggleWidget, // Expose the new function
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