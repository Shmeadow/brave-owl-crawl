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
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { SimpleAudioPlayer } from "@/components/simple-audio-player";
import { useEffects } from "@/context/effect-provider";
import { RainEffect } from "@/components/effects/rain-effect";
import { SnowEffect } from "@/components/effects/snow-effect";
import { RaindropsEffect } from "@/components/effects/raindrops-effect";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import { useNotifications } from "@/hooks/use-notifications"; // Import useNotifications
import { UpgradeButton } from "@/components/upgrade-button"; // Import UpgradeButton

// Constants for layout dimensions
const HEADER_HEIGHT = 64; // px
const SIDEBAR_WIDTH_DESKTOP = 60; // px

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading, session } = useSupabase(); // Get session here
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar(); // Get setIsSidebarOpen
  const { isAlwaysOpen, mounted } = useSidebarPreference();
  const { isCurrentRoomWritable } = useCurrentRoom();
  const { activeEffect } = useEffects();
  const isMobile = useIsMobile(); // Use the mobile hook
  const { addNotification } = useNotifications(); // Use the notifications hook

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(0);
  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // State for Header and related components
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(true); // Changed to true

  const chatPanelWidth = isChatOpen ? 320 : 56;
  const isDashboard = pathname === '/dashboard';

  const handleNewUnreadMessage = () => {
    setUnreadChatCount((prev) => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

  // State to track if the welcome notification has been shown for the current session
  const [welcomeNotificationShown, setWelcomeNotificationShown] = useState(false);

  useEffect(() => {
    // Show welcome notification only once per session after user logs in
    if (session && !loading && !welcomeNotificationShown) {
      addNotification("Welcome to Productivity Hub! Explore your new workspace.");
      setWelcomeNotificationShown(true);
    }
    // Reset if session changes (e.g., user logs out and then logs in again)
    if (!session && welcomeNotificationShown) {
      setWelcomeNotificationShown(false);
    }
  }, [session, loading, welcomeNotificationShown, addNotification]);


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
  }, [sidebarCurrentWidth, isMobile]); // Depend on isMobile

  if (loading) {
    return <LoadingScreen />;
  }
  
  // Removed: Hide main app layout on the pricing page
  // if (pathname === '/pricing') {
  //   return <>{children}</>;
  // }

  return (
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
          isMobile={isMobile} // Pass isMobile
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} // Pass sidebar toggle
        />
        <Sidebar isMobile={isMobile} /> {/* Pass isMobile */}
        <div
          className="absolute top-16 right-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out bg-transparent"
          style={{ left: `${sidebarCurrentWidth}px` }}
        >
          <main className="flex-1 relative overflow-y-auto bg-transparent">
            <div className="p-4 sm:p-6 lg:p-8 h-full">
              {children}
            </div>
            {isDashboard && <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} isMobile={isMobile} />} {/* Pass isMobile */}
          </main>
        </div>
        {isDashboard && <PomodoroWidget 
          isMinimized={isPomodoroMinimized}
          setIsMinimized={setIsPomodoroMinimized}
          chatPanelWidth={chatPanelWidth}
          isMobile={isMobile} // Pass isMobile
        />}
        {isDashboard && <SimpleAudioPlayer isMobile={isMobile} />} {/* Pass isMobile */}
        {isDashboard && !isMobile && (
          <UpgradeButton className="fixed bottom-4 right-4 z-[901]" />
        )}
        <Toaster />
      </div>
    </WidgetProvider>
  );
}