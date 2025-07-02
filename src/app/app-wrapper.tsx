"use client";

import React, { useState, useRef, useEffect } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import { WidgetProvider } from "@/components/widget/widget-context";
import { WidgetContainer } from "@/components/widget/widget-container";
import { Toaster } from "@/components/ui/sonner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { ChatPanel } from "@/components/chat-panel";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { SimpleAudioPlayer } from "@/components/simple-audio-player";
import { GoalReminderBar } from "@/components/goal-reminder-bar";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";

const HEADER_HEIGHT = 64; // Corresponds to h-16 in Tailwind
const SIDEBAR_WIDTH = 60; // Width of the sidebar in pixels

const initialWidgetConfigs = {
  "spaces": { initialPosition: { x: 100, y: 100 }, initialWidth: 400, initialHeight: 500 },
  "sounds": { initialPosition: { x: 150, y: 150 }, initialWidth: 350, initialHeight: 450 },
  "calendar": { initialPosition: { x: 200, y: 200 }, initialWidth: 700, initialHeight: 600 },
  "timer": { initialPosition: { x: 250, y: 250 }, initialWidth: 400, initialHeight: 300 },
  "tasks": { initialPosition: { x: 300, y: 300 }, initialWidth: 400, initialHeight: 500 },
  "notes": { initialPosition: { x: 350, y: 350 }, initialWidth: 500, initialHeight: 600 },
  "media": { initialPosition: { x: 400, y: 400 }, initialWidth: 400, initialHeight: 500 },
  "fortune": { initialPosition: { x: 450, y: 450 }, initialWidth: 300, initialHeight: 200 },
  "breathe": { initialPosition: { x: 500, y: 500 }, initialWidth: 300, initialHeight: 300 },
  "flash-cards": { initialPosition: { x: 550, y: 550 }, initialWidth: 800, initialHeight: 700 },
  "goal-focus": { initialPosition: { x: 600, y: 600 }, initialWidth: 500, initialHeight: 600 },
};

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [mainContentArea, setMainContentArea] = useState({ left: 0, top: 0, width: 0, height: 0 });

  const { currentRoomId, isCurrentRoomWritable } = useCurrentRoom();
  const { isSidebarOpen } = useSidebar();
  const { isAlwaysOpen, mounted } = useSidebarPreference();

  const actualSidebarOpen = mounted ? (isAlwaysOpen || isSidebarOpen) : false;

  useEffect(() => {
    const updateMainContentArea = () => {
      if (mainContentRef.current) {
        const rect = mainContentRef.current.getBoundingClientRect();
        setMainContentArea({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // A small delay to allow the transition to start
    const timeoutId = setTimeout(updateMainContentArea, 50);
    window.addEventListener('resize', updateMainContentArea);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateMainContentArea);
    };
  }, [actualSidebarOpen]);

  const handleNewUnreadMessage = () => {
    setUnreadChatCount(prev => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

  return (
    <WidgetProvider initialWidgetConfigs={initialWidgetConfigs} mainContentArea={mainContentArea}>
      <div className="flex flex-col min-h-screen">
        <Header
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onNewUnreadMessage={handleNewUnreadMessage}
          onClearUnreadMessages={handleClearUnreadMessages}
          unreadChatCount={unreadChatCount}
        />
        <div className="flex flex-1 relative">
          <Sidebar />
          <main
            ref={mainContentRef}
            className={cn(
              "flex-1 transition-all duration-300 ease-in-out",
              "relative overflow-auto"
            )}
            style={{
              paddingTop: `${HEADER_HEIGHT}px`,
              paddingLeft: actualSidebarOpen ? `${SIDEBAR_WIDTH}px` : '0px',
              position: 'absolute',
              top: `-${HEADER_HEIGHT}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div className="h-full w-full relative">
              {children}
              <WidgetContainer isCurrentRoomWritable={isCurrentRoomWritable} mainContentArea={mainContentArea} />
            </div>
          </main>
        </div>
        <Toaster position="bottom-right" />
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        <div className="fixed bottom-4 right-4 z-[1000]">
          <ChatPanel
            isOpen={isChatOpen}
            onToggleOpen={() => setIsChatOpen(!isChatOpen)}
            onNewUnreadMessage={handleNewUnreadMessage}
            onClearUnreadMessages={handleClearUnreadMessages}
            unreadCount={unreadChatCount}
            currentRoomId={currentRoomId}
            isCurrentRoomWritable={isCurrentRoomWritable}
          />
        </div>
        <SimpleAudioPlayer />
        <GoalReminderBar />
      </div>
    </WidgetProvider>
  );
}