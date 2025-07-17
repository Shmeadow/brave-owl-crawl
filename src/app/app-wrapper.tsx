"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSupabase } from '@/integrations/supabase/auth';
import { useSidebar } from "@/components/sidebar/sidebar-context";
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
import dynamic from 'next/dynamic';
import { useRooms } from "@/hooks/use-rooms";
import { RoomJoinRequestNotification } from "@/components/notifications/RoomJoinRequestNotification"; // Corrected import path
import { GuestModeWarningBar } from "@/components/guest-mode-warning-bar";
import { CookieConsentBar } from "@/components/cookie-consent-bar";
import { MOBILE_CONTROLS_HEIGHT, MOBILE_HORIZONTAL_SIDEBAR_HEIGHT } from "@/lib/constants"; // Import new constant

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

// Constants for layout dimensions
const HEADER_HEIGHT = 56; // px - Changed from 64 to 56
const SIDEBAR_WIDTH_DESKTOP = 48; // px (from sidebar.tsx)
const SIDEBAR_LEFT_OFFSET = 8; // px (from sidebar.tsx)
const SIDEBAR_CONTENT_GAP = 16; // px (gap between sidebar and main content)

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading, session, profile } = useSupabase();
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar(); // isSidebarOpen will now always be true
  const { currentRoomId, currentRoomName, isCurrentRoomWritable } = useCurrentRoom();
  const { rooms, pendingRequests, dismissRequest } = useRooms();
  const { activeEffect } = useEffects();
  const isMobile = useIsMobile();
  const { goals } = useGoals();

  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(true);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const isDashboard = pathname === '/dashboard';
  const isLoginPage = pathname === '/login';
  const isLandingPage = pathname === '/landing';

  const handleNewUnreadMessage = () => setUnreadChatCount((prev) => prev + 1);
  const handleClearUnreadMessages = () => setUnreadChatCount(0);

  useEffect(() => {
    checkAndClearClientData();
  }, []);

  useEffect(() => {
    const welcomeBackShown = sessionStorage.getItem('welcomeBackShown');
    if (!welcomeBackShown && session) {
      setShowWelcomeBack(true);
      sessionStorage.setItem('welcomeBackShown', 'true');
    }
  }, [session]);

  const firstIncompleteGoal = goals.find(g => !g.completed) || null;

  useEffect(() => {
    const calculateArea = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let contentLeft = 0;
      let contentTop = HEADER_HEIGHT;
      let contentWidth = windowWidth;
      let contentHeight = windowHeight - HEADER_HEIGHT;

      if (!isMobile) {
        // Desktop layout
        contentLeft = SIDEBAR_WIDTH_DESKTOP + SIDEBAR_LEFT_OFFSET + SIDEBAR_CONTENT_GAP;
        contentWidth = windowWidth - contentLeft;
      } else {
        // Mobile layout: account for horizontal sidebar and bottom controls
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
  }, [isMobile]); // Added isMobile to dependencies

  if (loading) {
    return <LoadingScreen />;
  }

  if (pathname === '/pricing' || isLoginPage || isLandingPage) {
    return (
      <>
        {children}
        <Toaster />
        <CookieConsentBar />
      </>
    );
  }

  return (
    <AmbientSoundProvider>
      <FocusSessionProvider>
        <WidgetProvider initialWidgetConfigs={initialWidgetConfigs} mainContentArea={mainContentArea} isMobile={isMobile} isCurrentRoomWritable={isCurrentRoomWritable}>
          <div className="relative h-screen bg-transparent">
            {/* Removed the old shadow element */}
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
              // Removed onToggleSidebar prop as it's no longer needed
            />
            <DynamicWelcomeBackModal
              isOpen={showWelcomeBack}
              onClose={() => setShowWelcomeBack(false)}
              profile={profile}
              firstGoal={firstIncompleteGoal}
              currentRoomName={currentRoomName}
            />
            <DynamicPlayingSoundsBar isMobile={isMobile} />
            <Sidebar isMobile={isMobile} /> {/* Sidebar is always rendered */}
            <GuestModeWarningBar />
            {pendingRequests.length > 0 && (
              <RoomJoinRequestNotification
                request={pendingRequests[0]}
                onDismiss={dismissRequest}
              />
            )}
            <div
              role="main"
              className="absolute right-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out bg-transparent"
              style={{ left: `${mainContentArea.left}px`, top: `${mainContentArea.top}px`, width: `${mainContentArea.width}px`, height: `${mainContentArea.height}px` }}
            >
              <main className="flex-1 relative overflow-y-auto bg-transparent">
                <div className={cn("h-full", isMobile ? "p-4" : "p-4 sm:p-6 lg:p-8")}>
                  {children}
                  {isDashboard && (
                    <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} isMobile={isMobile} />
                  )}
                </div>
              </main>
            </div>
            {isDashboard && !isMobile && <IndependentPinnedWidgetsDock isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} />}
            {isDashboard && isMobile && (
              <>
                {/* Mobile-specific SimpleAudioPlayer positioned at middle-right */}
                <DynamicSimpleAudioPlayer isMobile={isMobile} displayMode="minimized" />
                <DynamicMobileControls>
                  <DynamicPomodoroWidget 
                    isMinimized={isPomodoroMinimized}
                    setIsMinimized={setIsPomodoroMinimized}
                    chatPanelWidth={0}
                    isMobile={isMobile}
                  />
                </DynamicMobileControls>
              </>
            )}
            {isDashboard && !isMobile && (
              <>
                <DynamicPomodoroWidget 
                  isMinimized={isPomodoroMinimized}
                  setIsMinimized={setIsPomodoroMinimized}
                  chatPanelWidth={0}
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
              currentRoomId={currentRoomId}
              currentRoomName={currentRoomName}
              isCurrentRoomWritable={isCurrentRoomWritable}
              isMobile={isMobile}
            />
            <Toaster />
            <CookieConsentBar />
          </div>
        </WidgetProvider>
      </FocusSessionProvider>
    </AmbientSoundProvider>
  );
}

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