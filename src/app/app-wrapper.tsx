"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/integrations/supabase/auth";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar/sidebar";
import { LoadingScreen } from "@/components/loading-screen";
import { WidgetProvider } from "@/components/widget/widget-context";
import { WidgetContainer } from "@/components/widget/widget-container";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { Header } from "@/components/header";
import { UpgradeModal } from "@/components/upgrade-modal";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { SimpleAudioPlayer } from "@/components/simple-audio-player";

// Constants for layout dimensions
const HEADER_HEIGHT = 64; // px

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading } = useSupabase();
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar();
  const { isAlwaysOpen, mounted } = useSidebarPreference();
  const { isCurrentRoomWritable } = useCurrentRoom();

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(0);
  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // State for Header and related components
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(false);

  const chatPanelWidth = isChatOpen ? 320 : 56;
  const isDashboard = pathname === '/dashboard';

  const handleNewUnreadMessage = () => {
    setUnreadChatCount((prev) => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

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
      <div className="relative h-screen bg-background">
        <Header
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onNewUnreadMessage={handleNewUnreadMessage}
          onClearUnreadMessages={handleClearUnreadMessages}
          unreadChatCount={unreadChatCount}
        />
        <Sidebar />
        <div
          className="absolute top-16 right-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out"
          style={{ left: `${sidebarCurrentWidth}px` }}
        >
          <main className="flex-1 relative overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 h-full">
              {children}
            </div>
            {isDashboard && <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} />}
          </main>
        </div>
        {isDashboard && <PomodoroWidget 
          isMinimized={isPomodoroMinimized}
          setIsMinimized={setIsPomodoroMinimized}
          chatPanelWidth={chatPanelWidth}
        />}
        {isDashboard && <SimpleAudioPlayer />}
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        <Toaster />
      </div>
    </WidgetProvider>
  );
}