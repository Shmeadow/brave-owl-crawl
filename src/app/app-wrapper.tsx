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
import { RoomJoinRequestNotification } from "@/components/notifications/RoomJoinRequestNotification";
import { GuestModeWarningBar } from "@/components/guest-mode-warning-bar";
import { CookieConsentBar } from "@/components/cookie-consent-bar";

const DynamicChatPanel = dynamic(() => import("@/components/chat-panel").then(mod => mod.ChatPanel), { ssr: false });
const DynamicPomodoroWidget = dynamic(() => import("@/components/pomodoro-widget").then(mod => mod.PomodoroWidget), { ssr: false });
const DynamicSimpleAudioPlayer = dynamic(() => import("@/components/simple-audio-player").then(mod => mod.SimpleAudioPlayer), { ssr: false });
const DynamicRainEffect = dynamic(() => import("@/components/effects/rain-effect").then(mod => mod.RainEffect), { ssr: false });
const DynamicSnowEffect = dynamic(() => import("@/components/effects/snow-effect").then(mod => mod.SnowEffect), { ssr: false });
const DynamicRaindropsEffect = dynamic(() => import("@/components/effects/raindrops-effect").then(mod => mod.RaindropsEffect), { ssr: false });
const DynamicPlayingSoundsBar = dynamic(() => import("@/components/playing-sounds-bar").then(mod => mod.PlayingSoundsBar), { ssr: false });
const DynamicWelcomeBackModal = dynamic(() => import("@/components/welcome-back-modal").then(mod => mod.WelcomeBackModal), { ssr: false });
const DynamicTimeAndProgressDisplay = dynamic(() => import("@/components/time-and-progress-display").then(mod => mod.TimeAndProgressDisplay), { ssr: false });

const HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH = 60;

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading, session, profile } = useSupabase();
  const pathname = usePathname();
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

  const chatPanelWidth = isChatOpen ? 320 : 56;
  const isDashboard = pathname === '/dashboard';
  const isLoginPage = pathname === '/login';
  const isLandingPage = pathname === '/landing';

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

      const contentLeft = SIDEBAR_WIDTH;
      const contentWidth = windowWidth - SIDEBAR_WIDTH;

      setMainContentArea({
        left: contentLeft,
        top: HEADER_HEIGHT,
        width: contentWidth,
        height: windowHeight - HEADER_HEIGHT,
      });
    };

    calculateArea();
    window.addEventListener('resize', calculateArea);
    return () => window.removeEventListener('resize', calculateArea);
  }, []);

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
        <WidgetProvider initialWidgetConfigs={initialWidgetConfigs} mainContentArea={mainContentArea}>
          <div className="relative h-screen bg-transparent">
            {activeEffect === 'rain' && <DynamicRainEffect />}
            {activeEffect === 'snow' && <DynamicSnowEffect />}
            {activeEffect === 'raindrops' && <DynamicRaindropsEffect />}
            <Header
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              unreadChatCount={unreadChatCount}
            />
            <DynamicWelcomeBackModal
              isOpen={showWelcomeBack}
              onClose={() => setShowWelcomeBack(false)}
              profile={profile}
              firstGoal={firstIncompleteGoal}
              currentRoomName={currentRoomName}
            />
            <DynamicPlayingSoundsBar isMobile={isMobile} />
            <Sidebar />
            
            <DynamicTimeAndProgressDisplay isMobile={isMobile} />
            <GuestModeWarningBar />

            {pendingRequests.length > 0 && (
              <RoomJoinRequestNotification
                request={pendingRequests[0]}
                onDismiss={dismissRequest}
              />
            )}

            <div
              role="main"
              className="absolute right-0 bottom-0 flex flex-col bg-transparent"
              style={{ left: `${mainContentArea.left}px`, top: `${HEADER_HEIGHT}px`, width: `${mainContentArea.width}px`, height: `${mainContentArea.height}px` }}
            >
              <main className="flex-1 relative overflow-y-auto bg-transparent">
                <div className="h-full p-4 sm:p-6 lg:p-8">
                  {children}
                  {isDashboard && (
                    <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} isMobile={isMobile} />
                  )}
                </div>
              </main>
            </div>
            
            {isDashboard && !isMobile && <IndependentPinnedWidgetsDock isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} />}

            {isDashboard && (
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
              currentRoomId={currentRoomId}
              currentRoomName={currentRoomName}
              isCurrentRoomWritable={isCurrentRoomWritable}
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