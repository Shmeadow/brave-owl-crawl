"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSupabase } from '@/integrations/supabase/auth';
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
import dynamic from 'next/dynamic';
import { useRooms } from "@/hooks/use-rooms";
import { RoomJoinRequestNotification } from "@/components/notifications/RoomJoinRequestNotification";
import { GuestModeWarningBar } from "@/components/guest-mode-warning-bar"; // New import

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
const DynamicNotificationsDropdown = dynamic(() => import("@/components/notifications/notifications-dropdown").then(mod => mod.NotificationsDropdown), { ssr: false });
const DynamicTimeAndProgressDisplay = dynamic(() => import("@/components/time-and-progress-display").then(mod => mod.TimeAndProgressDisplay), { ssr: false });


// Constants for layout dimensions
const HEADER_HEIGHT = 64; // px
const TOTAL_HEADER_AREA_HEIGHT = HEADER_HEIGHT;
const SIDEBAR_WIDTH_DESKTOP = 60; // px
const SIDEBAR_WIDTH_MOBILE = 250; // px (from sidebar.tsx)

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading, session, profile } = useSupabase();
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAlwaysOpen, mounted } = useSidebarPreference();
  const { currentRoomId, currentRoomName, isCurrentRoomWritable } = useCurrentRoom();
  const { rooms, pendingRequests, dismissRequest } = useRooms();
  const { activeEffect } = useEffects();
  const isMobile = useIsMobile();
  const { addNotification } = useNotifications();
  const { goals } = useGoals();

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(0);
  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // State for Header and related components
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(true); // Start minimized on mobile
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const chatPanelWidth = isChatOpen ? 320 : 56;
  const isDashboard = pathname === '/dashboard';
  const isLoginPage = pathname === '/login';
  const isLandingPage = pathname === '/landing';

  const handleNewUnreadMessage = () => {
    setUnreadChatCount((prev) => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

  // Determine the current room object
  const currentRoom = rooms.find(room => room.id === currentRoomId) ?? null;

  // Determine the background to use
  const backgroundToUse = currentRoom?.background_url
    ? { url: currentRoom.background_url, isVideo: currentRoom.is_video_background || false, isMirrored: false }
    : undefined;

  // Run client version check on initial mount
  useEffect(() => {
    checkAndClearClientData();
  }, []);

  useEffect(() => {
    // Show welcome back modal only once per session
    const welcomeBackShown = sessionStorage.getItem('welcomeBackShown');
    if (!welcomeBackShown && session) {
      setShowWelcomeBack(true);
      sessionStorage.setItem('welcomeBackShown', 'true');
    }
  }, [session]);

  const firstIncompleteGoal = goals.find(g => !g.completed) || null;

  useEffect(() => {
    // Calculate sidebar width based on mobile/desktop and open state
    const newSidebarWidth = isMobile && isSidebarOpen ? SIDEBAR_WIDTH_MOBILE : (mounted && isAlwaysOpen ? SIDEBAR_WIDTH_DESKTOP : 0);
    setSidebarCurrentWidth(newSidebarWidth);

    // For desktop, if isAlwaysOpen is true, ensure sidebar is open.
    // On mobile, isSidebarOpen is managed by SidebarProvider's initial state and Header's toggle.
    if (!isMobile && mounted && isAlwaysOpen) {
      setIsSidebarOpen(true);
    }
  }, [isSidebarOpen, isAlwaysOpen, mounted, isMobile, setIsSidebarOpen]);

  useEffect(() => {
    const calculateArea = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let contentLeft = 0;
      let contentWidth = windowWidth;

      if (!isMobile) {
        contentLeft = sidebarCurrentWidth;
        contentWidth = windowWidth - sidebarCurrentWidth;
      } else {
        // On mobile, if sidebar is open, adjust content area
        if (isSidebarOpen) {
          contentLeft = SIDEBAR_WIDTH_MOBILE;
          contentWidth = windowWidth - SIDEBAR_WIDTH_MOBILE;
        } else {
          // If sidebar is closed on mobile, content takes full width
          contentLeft = 0;
          contentWidth = windowWidth;
        }
      }

      setMainContentArea({
        left: contentLeft,
        top: TOTAL_HEADER_AREA_HEIGHT,
        width: contentWidth,
        height: windowHeight - TOTAL_HEADER_AREA_HEIGHT,
      });
    };

    calculateArea();
    window.addEventListener('resize', calculateArea);
    return () => window.removeEventListener('resize', calculateArea);
  }, [sidebarCurrentWidth, isMobile, isSidebarOpen]); // Added isSidebarOpen to dependencies

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
            <DynamicWelcomeBackModal
              isOpen={showWelcomeBack}
              onClose={() => setShowWelcomeBack(false)}
              profile={profile}
              firstGoal={firstIncompleteGoal}
              currentRoomName={currentRoomName}
            />
            <DynamicPlayingSoundsBar isMobile={isMobile} />
            <Sidebar isMobile={isMobile} />
            
            {/* Time and Progress Display - now always visible on main app pages */}
            <DynamicTimeAndProgressDisplay isMobile={isMobile} />

            {/* Guest Mode Warning Bar */}
            <GuestModeWarningBar />

            {/* Room Join Request Notification */}
            {pendingRequests.length > 0 && (
              <RoomJoinRequestNotification
                request={pendingRequests[0]}
                onDismiss={dismissRequest}
              />
            )}

            {/* Main content area, where widgets and page content live */}
            <div
              role="main"
              className="absolute right-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out bg-transparent"
              style={{ left: `${mainContentArea.left}px`, top: `${TOTAL_HEADER_AREA_HEIGHT}px`, width: `${mainContentArea.width}px` }}
            >
              <main className="flex-1 relative overflow-y-auto bg-transparent">
                <div className={cn("h-full", isMobile ? "p-2" : "p-4 sm:p-6 lg:p-8")}> {/* Adjusted padding for mobile */}
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
                <DynamicSimpleAudioPlayer isMobile={isMobile} displayMode="minimized" /> {/* Pass displayMode for initial state */}
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
              currentRoomId={currentRoomId}
              currentRoomName={currentRoomName}
              isCurrentRoomWritable={isCurrentRoomWritable}
              isMobile={isMobile}
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