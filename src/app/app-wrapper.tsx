"use client";
import React, { useState, useEffect, useRef } from "react";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { Toaster } from "@/components/ui/sonner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { WidgetProvider } from "@/components/widget/widget-context";
import { WidgetContainer } from "@/components/widget/widget-container";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { cn } from "@/lib/utils";
import { SimpleAudioPlayer } from "@/components/simple-audio-player"; // Import the new player

const LOCAL_STORAGE_POMODORO_MINIMIZED_KEY = 'pomodoro_widget_minimized';
const CHAT_PANEL_WIDTH_OPEN = 320;
const CHAT_PANEL_WIDTH_CLOSED = 56;
const HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH = 60;

const WIDGET_CONFIGS = {
  "spaces": { initialPosition: { x: 150, y: 100 }, initialWidth: 600, initialHeight: 700 },
  "sounds": { initialPosition: { x: 800, y: 150 }, initialWidth: 500, initialHeight: 600 },
  "calendar": { initialPosition: { x: 200, y: 200 }, initialWidth: 800, initialHeight: 700 },
  "timer": { initialPosition: { x: 900, y: 250 }, initialWidth: 400, initialHeight: 400 },
  "tasks": { initialPosition: { x: 250, y: 300 }, initialWidth: 500, initialHeight: 600 },
  "notes": { initialPosition: { x: 700, y: 350 }, initialWidth: 500, initialHeight: 600 },
  "media": { initialPosition: { x: 300, y: 400 }, initialWidth: 600, initialHeight: 500 },
  "fortune": { initialPosition: { x: 850, y: 450 }, initialWidth: 400, initialHeight: 300 },
  "breathe": { initialPosition: { x: 350, y: 500 }, initialWidth: 400, initialHeight: 300 },
  "flash-cards": { initialPosition: { x: 500, y: 100 }, initialWidth: 900, initialHeight: 700 },
  "goal-focus": { initialPosition: { x: 400, y: 550 }, initialWidth: 500, initialHeight: 600 },
};

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar();
  const { isAlwaysOpen } = useSidebarPreference();
  const { currentRoomId, isCurrentRoomWritable } = useCurrentRoom();

  const [isPomodoroWidgetMinimized, setIsPomodoroWidgetMinimized] = useState<boolean>(true); // Default to true for SSR
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Use state for mainContentArea to ensure it updates on resize
  const [mainContentArea, setMainContentArea] = useState({
    left: SIDEBAR_WIDTH,
    top: HEADER_HEIGHT,
    width: 0,
    height: 0,
  });

  // Calculate and update mainContentArea on mount and window resize
  useEffect(() => {
    const calculateMainContentArea = () => {
      if (typeof window !== 'undefined') {
        const chatWidth = isChatOpen ? CHAT_PANEL_WIDTH_OPEN : CHAT_PANEL_WIDTH_CLOSED;
        const sidebarWidth = (isAlwaysOpen || isSidebarOpen) ? SIDEBAR_WIDTH : 0; // Dynamic sidebar width

        setMainContentArea({
          left: sidebarWidth,
          top: HEADER_HEIGHT,
          width: window.innerWidth - sidebarWidth - chatWidth,
          height: window.innerHeight - HEADER_HEIGHT,
        });
      }
    };

    // Initial calculation
    calculateMainContentArea();

    // Add resize listener
    window.addEventListener('resize', calculateMainContentArea);

    // Cleanup
    return () => {
      window.removeEventListener('resize', calculateMainContentArea);
    };
  }, [isChatOpen, isAlwaysOpen, isSidebarOpen]); // Dependencies for recalculation

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY);
      if (savedMinimized !== null) { // Only update if a value was actually saved
        setIsPomodoroWidgetMinimized(savedMinimized === 'false' ? false : true);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_POMODORO_MINIMIZED_KEY, String(isPomodoroWidgetMinimized));
    }
  }, [isPomodoroWidgetMinimized, mounted]);

  const shouldShowPomodoro = pathname !== '/account' && pathname !== '/admin-settings';

  const handleOpenUpgradeModal = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleNewUnreadMessage = () => {
    setUnreadChatCount(prev => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

  const sidebarCurrentWidth = (isAlwaysOpen || isSidebarOpen) ? SIDEBAR_WIDTH : 0;
  const chatPanelCurrentWidth = isChatOpen ? CHAT_PANEL_WIDTH_OPEN : CHAT_PANEL_WIDTH_CLOSED;

  return (
    <WidgetProvider initialWidgetConfigs={WIDGET_CONFIGS} mainContentArea={mainContentArea}> {/* Pass state */}
      <div
        className="flex flex-col flex-1 min-h-screen"
        style={{
          '--sidebar-width': `${sidebarCurrentWidth}px`,
          '--chat-width': `${chatPanelCurrentWidth}px`,
          '--header-height': `${HEADER_HEIGHT}px`,
          // These are estimates for the player to position itself relative to the pomodoro widget
          '--pomodoro-widget-height-est': `${POMODORO_WIDGET_HEIGHT_EST}px`,
          '--pomodoro-widget-bottom-offset': `${POMODORO_WIDGET_BOTTOM_OFFSET}px`,
          '--player-pomodoro-buffer': `${PLAYER_POMODORO_BUFFER}px`,
        } as React.CSSProperties} // Cast to React.CSSProperties for custom properties
      >
        <Header
          onOpenUpgradeModal={handleOpenUpgradeModal}
          isChatOpen={isChatOpen}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
            if (!isChatOpen) {
              handleClearUnreadMessages();
            }
          }}
          onNewUnreadMessage={handleNewUnreadMessage}
          onClearUnreadMessages={handleClearUnreadMessages}
          unreadChatCount={unreadChatCount}
        />
        <Sidebar />
        <main
          className={cn(
            "flex flex-col flex-1 w-full overflow-auto transition-all duration-300 ease-in-out",
            `ml-[var(--sidebar-width)]`, // Dynamic left margin
            `mr-[var(--chat-width)]`,    // Dynamic right margin
            `pt-[var(--header-height)]`, // Dynamic top padding
            "items-center justify-center"
          )}
        >
          {children}
        </main>
      </div>

      <GoalReminderBar />
      {mounted && shouldShowPomodoro && (
        <PomodoroWidget
          isMinimized={isPomodoroWidgetMinimized}
          setIsMinimized={setIsPomodoroWidgetMinimized}
          chatPanelWidth={chatPanelCurrentWidth}
        />
      )}
      {mounted && <SimpleAudioPlayer />}
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModal(false)} />
      <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out">
        <ChatPanel
          isOpen={isChatOpen}
          onToggleOpen={() => {
            setIsChatOpen(!isChatOpen);
            if (!isChatOpen) {
              handleClearUnreadMessages();
            }
          }}
          onNewUnreadMessage={handleNewUnreadMessage}
          onClearUnreadMessages={handleClearUnreadMessages}
          unreadCount={unreadChatCount}
          currentRoomId={currentRoomId}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />
      </div>
      <Toaster />
      <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} /> {/* Pass state */}
    </WidgetProvider>
  );
}