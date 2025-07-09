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
import { useEffects } from "@/context/effect-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { AmbientSoundProvider } from "@/context/ambient-sound-provider";
import { FocusSessionProvider } from "@/context/focus-session-provider";
import { useGoals } from "@/hooks/use-goals";
import { PinnedWidgetsDock } from "@/components/pinned-widgets-dock";
import { useWidget } from "@/components/widget/widget-provider";
import { checkAndClearClientData } from "@/lib/client-version";
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamically import components that are not critical for initial render
const DynamicChatPanel = dynamic(() => import("@/components/chat-panel").then(mod => mod.ChatPanel), { ssr: false });
const DynamicPomodoroWidget = dynamic(() => import("@/components/pomodoro-widget").then(mod => mod.PomodoroWidget), { ssr: false });
const DynamicSimpleAudioPlayer = dynamic(() => import("@/components/simple-audio-player").then(mod => mod.SimpleAudioPlayer), { ssr: false });
const DynamicRainEffect = dynamic(() => import("@/components/effects/rain-effect").then(mod => mod.RainEffect), { ssr: false });
const DynamicSnowEffect = dynamic(() => import("@/components/effects/snow-effect").then(mod => mod.SnowEffect), { ssr: false });
const DynamicRaindropsEffect = dynamic(() => import("@/components/effects/raindrops-effect").then(mod => mod.RaindropsEffect), { ssr: false });
const DynamicPlayingSoundsBar = dynamic(() => import("@/components/playing-sounds-bar").then(mod => mod.PlayingSoundsBar), { ssr: false });
const DynamicMobileControls = dynamic(() => import("@/components/mobile-controls").then(mod => mod.MobileControls), { ssr: false });
const DynamicWelcomeBackModal = dynamic(() => import("@/components/welcome-back-modal").then(mod => mod.WelcomeBackModal), { ssr: false });
const DynamicRoomSettingsDialog = dynamic(() => import("@/components/room-settings-dialog").then(mod => mod.RoomSettingsDialog), { ssr: false });
const DynamicNotificationsDropdown = dynamic(() => import("@/components/notifications/notifications-dropdown").then(mod => mod.NotificationsDropdown), { ssr: false });
const DynamicTimeAndProgressDisplay = dynamic(() => import("@/components/time-and-progress-display").then(mod => mod.TimeAndProgressDisplay), { ssr: false });


// Constants for layout dimensions
const HEADER_HEIGHT = 64; // px
const TOTAL_HEADER_AREA_HEIGHT = HEADER_HEIGHT;
const SIDEBAR_WIDTH_DESKTOP = 60; // px

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading, session, profile } = useSupabase();
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAlwaysOpen, mounted } = useSidebarPreference();
  const { isCurrentRoomWritable } = useCurrentRoom();
  const { activeEffect } = useEffects();
  const isMobile = useIsMobile();
  const { addNotification } = useNotifications();
  const { goals } = useGoals();

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(0);
  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // State for Header and related components
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(true);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const chatPanelWidth = isChatOpen ? 320 : 56;
  const isDashboard = pathname === '/dashboard';
  const isLoginPage = pathname === '/login';
  const isLandingPage = pathname === '/landing'; // New: Check if it's the landing page

  const handleNewUnreadMessage = () => {
    setUnreadChatCount((prev) => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

  // Run client version check on initial mount
  useEffect(() => {
    checkAndClearClientData();
  }, []);

  useEffect(() => {
    // Show welcome back modal only once per session
    const welcomeBackShown = sessionStorage.getItem('welcomeBackShown');
    if (!welcomeBackShown && session) { // Only show if logged in
      setShowWelcomeBack(true);
      sessionStorage.setItem('welcomeBackBackShown', 'true');
    }
  }, [session]);

  const firstIncompleteGoal = goals.find(g => !g.completed) || null;

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
        top: TOTAL_HEADER_AREA_HEIGHT,
        width: isMobile ? windowWidth : windowWidth - sidebarCurrentWidth,
        height: windowHeight - TOTAL_HEADER_AREA_HEIGHT,
      });
    };

    calculateArea();
    window.addEventListener('resize', calculateArea);
    return () => window.removeEventListener('resize', calculateArea);
  }, [sidebarCurrentWidth, isMobile]);

  if (loading) {
    return (
      <LoadingScreen />
    );
  }
  
  // If it's the pricing, login, or landing page, render only children and Toaster
  if (pathname === '/pricing' || isLoginPage || isLandingPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  // Render the main application layout for all other pages
  return (
    <AmbientSoundProvider>
      <FocusSessionProvider>
        {/* WidgetProvider wraps everything that needs widget context */}
        <WidgetProvider initialWidgetConfigs={initialWidgetConfigs} mainContentArea={mainContentArea}>
          <div className="relative h-screen bg-transparent">
            {activeEffect === 'rain' && <DynamicRainEffect />}
            {activeEffect === 'snow' && <DynamicSnowEffect />}
            {activeEffect === 'raindrops' && <DynamicRaindropsEffect />}
            <Header
              isChatOpen={isChatOpen}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              onNewUnreadMessage={handleNewUnreadMessage}
              onClearUnreadMessages={handleClearUnreadMessages}
              unreadChatCount={unreadChatCount}
              isMobile={isMobile}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            {!isMobile && <DynamicTimeAndProgressDisplay className="fixed top-16 right-4 z-[902] bg-card/50 backdrop-blur-xl border border-white/20 rounded-lg p-2" />}
            <DynamicWelcomeBackModal
              isOpen={showWelcomeBack}
              onClose={() => setShowWelcomeBack(false)}
              profile={profile}
              firstGoal={firstIncompleteGoal}
            />
            <DynamicPlayingSoundsBar isMobile={isMobile} />
            <Sidebar isMobile={isMobile} />
            
            {/* Main content area, where widgets and page content live */}
            <div
              role="main"
              className="absolute right-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out bg-transparent"
              style={{ left: `${sidebarCurrentWidth}px`, top: `${TOTAL_HEADER_AREA_HEIGHT}px` }}
            >
              <main className="flex-1 relative overflow-y-auto bg-transparent">
                <div className="p-4 sm:p-6 lg:p-8 h-full">
                  {children}
                  {isDashboard && (
                    // WidgetContainer now renders ALL widgets, managing their visibility internally
                    <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} isMobile={isMobile} />
                  )}
                </div>
              </main>
            </div>
            
            {/* PinnedWidgetsDock is now a sibling to WidgetContainer, ensuring independence */}
            {isDashboard && !isMobile && <IndependentPinnedWidgetsDock isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} />}

            {isDashboard && isMobile && (
              <DynamicMobileControls>
                <DynamicPomodoroWidget 
                  isMinimized={isPomodoroMinimized}
                  setIsMinimized={setIsPomodoroMinimized}
                  chatPanelWidth={chatPanelWidth}
                  isMobile={isMobile}
                />
                <DynamicSimpleAudioPlayer isMobile={isMobile} />
              </DynamicMobileControls>
            )}

            {isDashboard && !isMobile && (
              <>
                <DynamicPomodoroWidget 
                  isMinimized={isPomodoroMinimized}
                  setIsMinimized={setIsPomodoroMinimized}
                  chatPanelWidth={chatPanelWidth}
                  isMobile={isMobile}
                />
                <DynamicSimpleAudioPlayer isMobile={isMobile} />
              </>
            )}

            <DynamicChatPanel
              isOpen={isChatOpen}
              onToggleOpen={() => setIsChatOpen(!isChatOpen)}
              onNewUnreadMessage={handleNewUnreadMessage}
              onClearUnreadMessages={handleClearUnreadMessages}
              unreadCount={unreadChatCount}
              currentRoomId={null} // This needs to be passed from useCurrentRoom if chat is room-specific
              isCurrentRoomWritable={isCurrentRoomWritable}
              isMobile={isMobile}
            />
            <DynamicNotificationsDropdown />
            <DynamicRoomSettingsDialog
              isOpen={false} // This needs to be managed by a state in Header or a parent
              onClose={() => {}}
              currentRoom={null} // This needs to be passed from useCurrentRoom
              isOwnerOfCurrentRoom={false} // This needs to be passed
            />

            <Toaster />
          </div>
        </WidgetProvider>
      </FocusSessionProvider>
    </AmbientSoundProvider>
  );
}

// Create a wrapper component for PinnedWidgetsDock to access useWidget
function IndependentPinnedWidgetsDock({ isCurrentRoomWritable, mainContentArea }: { isCurrentRoomWritable: boolean; mainContentArea: any }) {
  const { activeWidgets } = useWidget();
  const pinnedWidgets = activeWidgets.filter(widget => widget.isPinned);
  return (
    <PinnedWidgetsDock
      pinnedWidgets={pinnedWidgets}
      mainContentArea={mainContentArea}
      isCurrentRoomWritable={isCurrentRoomWritable}
    />
  );
}