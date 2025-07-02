"use client";
import React, { useState, useEffect, useRef } from "react";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { WidgetProvider } from "@/components/widget/widget-context";
import { MediaPlayerProvider } from "@/components/media-player-context";
import { AppContent } from "@/components/app-content"; // Import the new AppContent component

const WIDGET_CONFIGS = {
  "spaces": { initialPosition: { x: 150, y: 100 }, initialWidth: 600, initialHeight: 700 },
  "sounds": { initialPosition: { x: 800, y: 150 }, initialWidth: 500, initialHeight: 600 },
  "calendar": { initialPosition: { x: 200, y: 200 }, initialWidth: 800, initialHeight: 700 },
  "timer": { initialPosition: { x: 900, y: 250 }, initialWidth: 400, initialHeight: 400 },
  "tasks": { initialPosition: { x: 250, y: 300 }, initialWidth: 500, initialHeight: 600 },
  "notes": { initialPosition: { x: 700, y: 350 }, initialWidth: 500, initialHeight: 600 },
  "media": { initialPosition: { x: 300, y: 400 }, initialWidth: 600, initialHeight: 500 },
  "fortune": { initialPosition: { x: 850, y: 450 }, initialWidth: 400, initialHeight: 300 },
  "breathe": { initialPosition: { x: 350, y: 500 }, initialWidth: 400, initialHeight: 300 },
  "flash-cards": { initialPosition: { x: 500, y: 100 }, initialWidth: 900, initialHeight: 700 },
  "goal-focus": { initialPosition: { x: 400, y: 550 }, initialWidth: 500, initialHeight: 600 },
};

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  // Constants for initial layout dimensions
  const HEADER_HEIGHT = 64;
  const SIDEBAR_WIDTH_CLOSED = 60;
  const CHAT_PANEL_WIDTH_CLOSED = 56; // Assuming chat is closed by default for initial calculation

  // Use useRef to create a stable object for WidgetProvider's initial mainContentArea
  const mainContentAreaForWidgets = useRef({
    left: SIDEBAR_WIDTH_CLOSED,
    top: HEADER_HEIGHT,
    width: 0, // Will be calculated once on mount
    height: 0, // Will be calculated once on mount
  });

  // Calculate initial width/height once on mount for the ref
  useEffect(() => {
    if (typeof window !== 'undefined') {
      mainContentAreaForWidgets.current.width = window.innerWidth - SIDEBAR_WIDTH_CLOSED - CHAT_PANEL_WIDTH_CLOSED;
      mainContentAreaForWidgets.current.height = window.innerHeight - HEADER_HEIGHT;
    }
  }, []); // Empty dependency array ensures this runs only once on mount


  return (
    <WidgetProvider initialWidgetConfigs={WIDGET_CONFIGS} mainContentArea={mainContentAreaForWidgets.current}>
      <SidebarProvider>
        <AppContent>
          {children}
        </AppContent>
      </SidebarProvider>
    </WidgetProvider>
  );
}