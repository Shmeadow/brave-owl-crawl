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
import { useEffects } from "@/context/effect-provider";
import { RainEffect } from "@/components/effects/rain-effect";
import { SnowEffect } from "@/components/effects/snow-effect";
import { RaindropsEffect } from "@/components/effects/raindrops-effect";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatPanel } from "@/components/chat-panel"; // Import ChatPanel

// Constants for layout dimensions
const HEADER_HEIGHT = 64; // px
const SIDEBAR_WIDTH_DESKTOP = 60; // px

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading } = useSupabase();
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAlwaysOpen, mounted } = useSidebarPreference();
  const { isCurrentRoomWritable, currentRoomBackgroundUrl, isCurrentRoomVideoBackground, currentRoomId } = useCurrentRoom(); // Get background info
  const { activeEffect } = useEffects();
  const isMobile = useIsMobile();

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
    // On mobile, sidebar is always off-canvas, so content starts at 0.
    // On desktop, it's either 0 (closed) or SIDEBAR_WIDTH_DESKTOP (open/always open).
    const newSidebarWidth = isMobile ? 0 : (mounted && isAlwaysOpen || isSidebarOpen ? SIDEBAR_WIDTH_DESKTOP : 0);
    setSidebarCurrentWidth(newSidebarWidth);

    // If on mobile, ensure sidebar is closed by default (unless explicitly opened by hamburger)
    if (isMobile && isSidebarOpen && !isAlwaysOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen, isAlwaysOpen, mounted, isMobile, setIsSidebarOpen]);

  useEffect(() => {
    const calculateArea = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      setMainContentArea({
        left: isMobile ? 0 : sidebarCurrentWidth, // On mobile, content always starts at left 0
        top: HEADER_HEIGHT,
        width: isMobile ? windowWidth : windowWidth - sidebarCurrentWidth, // On mobile, content is full width
        height: windowHeight - HEADER_HEIGHT,
      });
    };

    calculateArea();
    window.addEventListener('resize', calculateArea);
    return () => window.removeEventListener('resize', calculateArea);
  }, [sidebarCurrentWidth, isMobile]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <WidgetProvider initialWidgetConfigs={initialWidgetConfigs} mainContentArea={mainContentArea}>
      <div className="relative h-screen bg-transparent">
        {activeEffect === 'rain' && <RainEffect />}
        {activeEffect === 'snow' && <SnowEffect />}
        {activeEffect === 'raindrops' && <RaindropsEffect />}
        <Header
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          onToggleChat={() => setIsChatOpen(!isChatOpen)} // Pass toggle function
          unreadChatCount={unreadChatCount} // Pass unread count
          isMobile={isMobile}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <Sidebar isMobile={isMobile} isCurrentRoomWritable={isCurrentRoomWritable} /> {/* Pass isCurrentRoomWritable */}
        <div
          className="absolute top-16 right-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out bg-transparent"
          style={{ left: `${sidebarCurrentWidth}px` }}
        >
          <main className="flex-1 relative overflow-y-auto bg-transparent">
            <div className="p-4 sm:p-6 lg:p-8 h-full">
              {children}
            </div>
            {isDashboard && <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} isMobile={isMobile} />}
          </main>
        </div>
        {isDashboard && <PomodoroWidget 
          isMinimized={isPomodoroMinimized}
          setIsMinimized={setIsPomodoroMinimized}
          chatPanelWidth={chatPanelWidth}
          isMobile={isMobile}
        />}
        {isDashboard && <SimpleAudioPlayer isMobile={isMobile} />}
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        <Toaster />
        {/* ChatPanel rendered here */}
        <ChatPanel
          isOpen={isChatOpen}
          onToggleOpen={() => setIsChatOpen(!isChatOpen)}
          onNewUnreadMessage={handleNewUnreadMessage}
          onClearUnreadMessages={handleClearUnreadMessages}
          unreadCount={unreadChatCount}
          currentRoomId={currentRoomId}
          isCurrentRoomWritable={isCurrentRoomWritable}
          isMobile={isMobile}
        />
      </div>
    </WidgetProvider>
  );
}