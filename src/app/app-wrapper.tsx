"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/integrations/supabase/auth";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar/sidebar";
import { LoadingScreen } from "@/components/loading-screen";
import { WidgetProvider } from "@/components/widget/widget-provider";
import { WidgetContainer } from "@/components/widget/widget-container";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { Header } from "@/components/header";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { SimpleAudioPlayer } from "@/components/simple-audio-player";
import { useEffects } from "@/context/effect-provider";
import { RainEffect } from "@/components/effects/rain-effect";
import { SnowEffect } from "@/components/effects/snow-effect";
import { RaindropsEffect } from "@/components/effects/raindrops-effect";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { AmbientSoundProvider } from "@/context/ambient-sound-provider";
import { PlayingSoundsBar } from "@/components/playing-sounds-bar";
import { MobileControls } from "@/components/mobile-controls";
import { FocusSessionProvider } from "@/context/focus-session-provider";

// Constants for layout dimensions
const HEADER_HEIGHT = 64; // px
const SIDEBAR_WIDTH_DESKTOP = 60; // px

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading, session } = useSupabase();
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAlwaysOpen, mounted } = useSidebarPreference();
  const { isCurrentRoomWritable } = useCurrentRoom();
  const { activeEffect } = useEffects();
  const isMobile = useIsMobile();
  const { addNotification } = useNotifications();

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(0);
  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // State for Header and related components
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(true);

  const chatPanelWidth = isChatOpen ? 320 : 56;
  const isDashboard = pathname === '/dashboard';

  const handleNewUnreadMessage = () => {
    setUnreadChatCount((prev) => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

  useEffect(() => {
    const newSidebarWidth = isMobile ? 0 : (mounted && isAlwaysOpen || isSidebarOpen ? SIDEBAR_WIDTH_DESKTOP : 0);
    setSidebarCurrentWidth(newSidebarWidth);

    if (isMobile && isSidebarOpen && !isAlwaysOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen, isAlwaysOpen, mounted, isMobile, setIsSidebarOpen]);

  useEffect(() => {
    const calculateArea = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      setMainContentArea({
        left: isMobile ? 0 : sidebarCurrentWidth,
        top: HEADER_HEIGHT,
        width: isMobile ? windowWidth : windowWidth - sidebarCurrentWidth,
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
  
  if (pathname === '/pricing') {
    return <>{children}</>;
  }

  return (
    <AmbientSoundProvider>
      <FocusSessionProvider>
        <WidgetProvider initialWidgetConfigs={initialWidgetConfigs} mainContentArea={mainContentArea}>
          <div className="relative h-screen bg-transparent">
            {activeEffect === 'rain' && <RainEffect />}
            {activeEffect === 'snow' && <SnowEffect />}
            {activeEffect === 'raindrops' && <RaindropsEffect />}
            <Header
              isChatOpen={isChatOpen}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              onNewUnreadMessage={handleNewUnreadMessage}
              onClearUnreadMessages={handleClearUnreadMessages}
              unreadChatCount={unreadChatCount}
              isMobile={isMobile}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <PlayingSoundsBar isMobile={isMobile} />
            <Sidebar isMobile={isMobile} />
            <div
              className="absolute top-16 right-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out bg-transparent"
              style={{ left: `${sidebarCurrentWidth}px` }}
            >
              <main className="flex-1 relative overflow-y-auto bg-transparent">
                <div className="p-4 sm:p-6 lg:p-8 h-full">
                  {children}
                  {isDashboard && (
                    <div className={cn(
                      "w-full h-full",
                      isMobile ? "flex flex-col items-center gap-4 py-4" : "fixed inset-0 z-[903] pointer-events-none"
                    )}>
                      <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} isMobile={isMobile} />
                    </div>
                  )}
                </div>
              </main>
            </div>
            
            {isDashboard && isMobile && (
              <MobileControls>
                <PomodoroWidget 
                  isMinimized={isPomodoroMinimized}
                  setIsMinimized={setIsPomodoroMinimized}
                  chatPanelWidth={chatPanelWidth}
                  isMobile={isMobile}
                />
                <SimpleAudioPlayer isMobile={isMobile} />
              </MobileControls>
            )}

            {isDashboard && !isMobile && (
              <>
                <PomodoroWidget 
                  isMinimized={isPomodoroMinimized}
                  setIsMinimized={setIsPomodoroMinimized}
                  chatPanelWidth={chatPanelWidth}
                  isMobile={isMobile}
                />
                <SimpleAudioPlayer isMobile={isMobile} />
              </>
            )}

            <Toaster />
          </div>
        </WidgetProvider>
      </FocusSessionProvider>
    </AmbientSoundProvider>
  );
}