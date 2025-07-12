"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/integrations/supabase/auth";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { Sidebar } from "@/components/sidebar/sidebar";
import { WidgetProvider } from "@/components/widget/widget-provider";
import { WidgetContainer } from "@/components/widget/widget-container";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { Header } from "@/components/header";
import { useEffects } from "@/context/effect-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGoals } from "@/hooks/use-goals";
import { PinnedWidgetsDock } from "@/components/pinned-widgets-dock";
import { useWidget } from "@/components/widget/widget-provider";
import dynamic from 'next/dynamic';
import { useRooms } from "@/hooks/use-rooms";
import { cn } from "@/lib/utils";

const DynamicChatPanel = dynamic(() => import("@/components/chat-panel").then(mod => mod.ChatPanel), { ssr: false });
const DynamicPomodoroWidget = dynamic(() => import("@/components/pomodoro-widget").then(mod => mod.PomodoroWidget), { ssr: false });
const DynamicSimpleAudioPlayer = dynamic(() => import("@/components/simple-audio-player").then(mod => mod.SimpleAudioPlayer), { ssr: false });
const DynamicRainEffect = dynamic(() => import("@/components/effects/rain-effect").then(mod => mod.RainEffect), { ssr: false });
const DynamicSnowEffect = dynamic(() => import("@/components/effects/snow-effect").then(mod => mod.SnowEffect), { ssr: false });
const DynamicRaindropsEffect = dynamic(() => import("@/components/effects/raindrops-effect").then(mod => mod.RaindropsEffect), { ssr: false });
const DynamicPlayingSoundsBar = dynamic(() => import("@/components/playing-sounds-bar").then(mod => mod.PlayingSoundsBar), { ssr: false });
const DynamicMobileControls = dynamic(() => import("@/components/mobile-controls").then(mod => mod.MobileControls), { ssr: false });
const DynamicWelcomeBackModal = dynamic(() => import("@/components/welcome-back-modal").then(mod => mod.WelcomeBackModal), { ssr: false });
const DynamicTimeAndProgressDisplay = dynamic(() => import("@/components/time-and-progress-display").then(mod => mod.TimeAndProgressDisplay), { ssr: false });

const HEADER_HEIGHT = 64;
const TOTAL_HEADER_AREA_HEIGHT = HEADER_HEIGHT;
const SIDEBAR_WIDTH_DESKTOP = 60;
const SIDEBAR_WIDTH_MOBILE = 250;

function LayoutRenderer({ children }: { children: React.ReactNode }) {
  const { session, profile } = useSupabase();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { currentRoomId, currentRoomName, isCurrentRoomWritable } = useCurrentRoom();
  const { rooms } = useRooms();
  const { activeEffect } = useEffects();
  const isMobile = useIsMobile();
  const { goals } = useGoals();
  const { toggleWidget } = useWidget();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(true);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [spacesWidgetDefaultTab, setSpacesWidgetDefaultTab] = useState("my-room");

  const chatPanelWidth = isChatOpen ? 320 : 56;
  const isDashboard = usePathname() === '/dashboard';

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

  const { mainContentArea } = useWidget();

  return (
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
      <DynamicTimeAndProgressDisplay isMobile={isMobile} />
      <div
        role="main"
        className="absolute right-0 bottom-0 flex flex-col transition-all duration-300 ease-in-out bg-transparent"
        style={{ left: `${mainContentArea.left}px`, top: `${mainContentArea.top}px` }}
      >
        <main className="flex-1 relative overflow-y-auto bg-transparent">
          <div className="p-4 sm:p-6 lg:p-8 h-full">
            {children}
            {isDashboard && (
              <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} isMobile={isMobile} spacesWidgetDefaultTab={spacesWidgetDefaultTab} />
            )}
          </div>
        </main>
      </div>
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
        currentRoomId={currentRoomId}
        isCurrentRoomWritable={isCurrentRoomWritable}
        isMobile={isMobile}
      />
    </div>
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

export function MainAppLayout({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAlwaysOpen, mounted } = useSidebarPreference();
  const isMobile = useIsMobile();

  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(0);
  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    const newSidebarWidth = isMobile && isSidebarOpen ? SIDEBAR_WIDTH_MOBILE : (mounted && isAlwaysOpen ? SIDEBAR_WIDTH_DESKTOP : 0);
    setSidebarCurrentWidth(newSidebarWidth);
    if (!isMobile && mounted && isAlwaysOpen) {
      setIsSidebarOpen(true);
    }
  }, [isSidebarOpen, isAlwaysOpen, mounted, isMobile, setIsSidebarOpen]);

  useEffect(() => {
    const calculateArea = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setMainContentArea({
        left: sidebarCurrentWidth,
        top: TOTAL_HEADER_AREA_HEIGHT,
        width: windowWidth - sidebarCurrentWidth,
        height: windowHeight - TOTAL_HEADER_AREA_HEIGHT,
      });
    };
    calculateArea();
    window.addEventListener('resize', calculateArea);
    return () => window.removeEventListener('resize', calculateArea);
  }, [sidebarCurrentWidth]);

  return (
    <WidgetProvider initialWidgetConfigs={initialWidgetConfigs} mainContentArea={mainContentArea}>
      <LayoutRenderer>
        {children}
      </LayoutRenderer>
    </WidgetProvider>
  );
}