"use client";

import React, { useState, useEffect } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar/sidebar";
import { LoadingScreen } from "@/components/loading-screen";
import { WidgetProvider } from "@/components/widget/widget-context";
import { WidgetContainer } from "@/components/widget/widget-container";
import { useCurrentRoom } from "@/hooks/use-current-room";

// Constants for layout dimensions
const HEADER_HEIGHT = 64; // px

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading } = useSupabase();
  const { isSidebarOpen } = useSidebar();
  const { isAlwaysOpen, mounted } = useSidebarPreference();
  const { isCurrentRoomWritable } = useCurrentRoom();

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(0);
  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    const SIDEBAR_WIDTH = 60; // px
    const actualSidebarOpen = mounted ? (isAlwaysOpen || isSidebarOpen) : false;
    setSidebarCurrentWidth(actualSidebarOpen ? SIDEBAR_WIDTH : 0);
  }, [isSidebarOpen, isAlwaysOpen, mounted]);

  useEffect(() => {
    const calculateArea = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      setMainContentArea({
        left: sidebarCurrentWidth,
        top: HEADER_HEIGHT,
        width: windowWidth - sidebarCurrentWidth,
        height: windowHeight - HEADER_HEIGHT,
      });
    };

    calculateArea();
    window.addEventListener('resize', calculateArea);
    return () => window.removeEventListener('resize', calculateArea);
  }, [sidebarCurrentWidth]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <WidgetProvider initialWidgetConfigs={initialWidgetConfigs} mainContentArea={mainContentArea}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main
          className="flex flex-col flex-1 w-full overflow-auto transition-all duration-300 ease-in-out"
          style={{ marginLeft: `${sidebarCurrentWidth}px` }}
        >
          <div className="flex-1 p-4 sm:p-6 lg:p-8 relative">
            {children}
            <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} />
          </div>
          <Toaster />
        </main>
      </div>
    </WidgetProvider>
  );
}