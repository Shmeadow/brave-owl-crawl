"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/integrations/supabase/auth";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
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
import { AmbientSoundProvider } from "@/context/ambient-sound-provider";
import { PlayingSoundsBar } from "@/components/playing-sounds-bar";
import { MobileControls } from "@/components/mobile-controls";
import { FocusSessionProvider } from "@/context/focus-session-provider";
import { WelcomeBackModal } from "@/components/welcome-back-modal";
import { useGoals } from "@/hooks/use-goals";
import { PinnedWidgetsDock } from "@/components/pinned-widgets-dock";
import { useWidget } from "@/components/widget/widget-provider";
import { MagicDock } from "@/components/magic-dock";

const HEADER_HEIGHT = 64;

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading, session, profile } = useSupabase();
  const pathname = usePathname();
  const { isCurrentRoomWritable } = useCurrentRoom();
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

  const handleNewUnreadMessage = () => setUnreadChatCount((prev) => prev + 1);
  const handleClearUnreadMessages = () => setUnreadChatCount(0);

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
      setMainContentArea({
        left: 0,
        top: HEADER_HEIGHT,
        width: windowWidth,
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
              onToggleSidebar={() => {}} // No-op for now, can be used for mobile drawer later
            />
            <WelcomeBackModal
              isOpen={showWelcomeBack}
              onClose={() => setShowWelcomeBack(false)}
              profile={profile}
              firstGoal={firstIncompleteGoal}
            />
            <PlayingSoundsBar isMobile={isMobile} />
            <MagicDock />
            
            <main className="flex-1 relative overflow-y-auto bg-transparent pt-16">
              <div className="p-4 sm:p-6 lg:p-8 h-full">
                {children}
                {isDashboard && (
                  <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} isMobile={isMobile} />
                )}
              </div>
            </main>
            
            {isDashboard && <IndependentPinnedWidgetsDock isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} />}

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