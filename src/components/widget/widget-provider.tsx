"use client";
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  WidgetState,
  MainContentArea,
  WidgetConfig,
} from '@/hooks/widgets/types';
import { useWidgetPersistence } from '@/hooks/widgets/use-widget-persistence';
import { useWidgetActions } from '@/hooks/widgets/use-widget-actions';
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import { useCurrentRoom } from "@/hooks/use-current-room"; // Import useCurrentRoom

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
  // Removed mainContentArea, isMobile, isCurrentRoomWritable from props
}

export function WidgetProvider({ children, initialWidgetConfigs }: WidgetProviderProps) {
  const isMobile = useIsMobile(); // Get isMobile here
  const { currentRoomId, currentRoomName, isCurrentRoomWritable } = useCurrentRoom(); // Get room writability here

  // Calculate mainContentArea dynamically within the client component
  const [mainContentArea, setMainContentArea] = useState<MainContentArea>({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    const HEADER_HEIGHT = 56; // px
    const SIDEBAR_WIDTH_DESKTOP = 48; // px
    const SIDEBAR_LEFT_OFFSET = 8; // px
    const SIDEBAR_CONTENT_GAP = 16; // px
    const MOBILE_CONTROLS_HEIGHT = 40; // px
    const MOBILE_HORIZONTAL_SIDEBAR_HEIGHT = 48; // px

    const calculateArea = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let contentLeft = 0;
      let contentTop = HEADER_HEIGHT;
      let contentWidth = windowWidth;
      let contentHeight = windowHeight - HEADER_HEIGHT;

      if (!isMobile) {
        contentLeft = SIDEBAR_WIDTH_DESKTOP + SIDEBAR_LEFT_OFFSET + SIDEBAR_CONTENT_GAP;
        contentWidth = windowWidth - contentLeft;
      } else {
        contentTop += MOBILE_HORIZONTAL_SIDEBAR_HEIGHT;
        contentHeight -= (MOBILE_HORIZONTAL_SIDEBAR_HEIGHT + MOBILE_CONTROLS_HEIGHT);
      }

      setMainContentArea({
        left: contentLeft,
        top: contentTop,
        width: contentWidth,
        height: contentHeight,
      });
    };

    calculateArea();
    window.addEventListener('resize', calculateArea);
    return () => window.removeEventListener('resize', calculateArea);
  }, [isMobile]);

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