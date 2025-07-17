"use client";
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  WidgetState,
  MainContentArea,
  WidgetConfig,
} from '@/hooks/widgets/types'; // Corrected import path
import { useWidgetPersistence } from '@/hooks/widgets/use-widget-persistence'; // Corrected import path
import { useWidgetActions } from '@/hooks/widgets/use-widget-actions'; // Corrected import path

interface WidgetContextType {
  activeWidgets: WidgetState[]; // Now contains ALL widgets, with isClosed flag
  addWidget: (id: string, title: string) => void;
  removeWidget: (id: string) => void; // Now sets isClosed to true
  updateWidgetPosition: (id: string, newPosition: { x: number; y: number }) => void;
  updateWidgetSize: (id: string, newSize: { width: number; height: number }) => void;
  bringWidgetToFront: (id: string) => void;
  maximizeWidget: (id: string) => void;
  togglePinned: (id: string) => void;
  closeWidget: (id: string) => void; // Now sets isClosed to true
  toggleWidget: (id: string, title: string) => void;
  topmostZIndex: number;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

interface WidgetProviderProps {
  children: React.ReactNode;
  initialWidgetConfigs: { [key: string]: WidgetConfig };
  mainContentArea: MainContentArea;
  isMobile: boolean; // Added isMobile prop
  isCurrentRoomWritable: boolean; // New prop
}

export function WidgetProvider({ children, initialWidgetConfigs, mainContentArea, isMobile, isCurrentRoomWritable }: WidgetProviderProps) {
  const { activeWidgets, setActiveWidgets, loading: persistenceLoading, isLoggedInMode } = useWidgetPersistence({ initialWidgetConfigs, mainContentArea, isMobile, isCurrentRoomWritable });

  const {
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
  } = useWidgetActions({ activeWidgets, setActiveWidgets, initialWidgetConfigs, mainContentArea, isMobile });

  // Sync maxZIndex from persistence to actions
  useEffect(() => {
    if (!persistenceLoading && activeWidgets.length > 0) {
      const currentMaxZ = Math.max(...activeWidgets.map((w: WidgetState) => w.zIndex));
      setMaxZIndex(currentMaxZ);
    }
  }, [persistenceLoading, activeWidgets, setMaxZIndex]);

  const contextValue = useMemo(
    () => ({
      activeWidgets,
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
    }),
    [
      activeWidgets,
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