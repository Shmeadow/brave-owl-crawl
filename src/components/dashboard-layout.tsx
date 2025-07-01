"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { ChatPanel } from "@/components/chat-panel";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/hooks/use-app-settings";
import { Toaster } from "@/components/ui/sonner";
import { SpotifyEmbedModal } from "@/components/spotify-embed-modal";
import { UpgradeModal } from "@/components/upgrade-modal";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [chatPanelWidth, setChatPanelWidth] = useState(0); // State to hold chat panel width

  const { settings, loading: settingsLoading } = useAppSettings();

  const handleNewUnreadMessage = () => {
    setUnreadChatCount((prev) => prev + 1);
  };

  const handleClearUnreadMessages = () => {
    setUnreadChatCount(0);
  };

  // Effect to measure chat panel width (for future use if needed for layout adjustments)
  useEffect(() => {
    // This is a placeholder. In a real scenario, you'd use a ref on the ChatPanel
    // and measure its width when it's open. For now, we'll assume a fixed width.
    setChatPanelWidth(isChatOpen ? 320 : 0); // Assuming chat panel is 320px wide
  }, [isChatOpen]);

  const isCozyThemeEnabled = settings?.is_cozy_theme_enabled ?? true; // Default to true if settings not loaded

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        isCozyThemeEnabled ? "bg-cover bg-center bg-fixed" : "bg-background",
        isCozyThemeEnabled && "bg-[url('/images/cozy-bg.jpg')]"
      )}
    >
      <Header
        unreadChatCount={unreadChatCount}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
      />
      <main
        className={cn(
          "flex-1 flex flex-col items-start p-4 md:p-8", // Changed items-center to items-start
          "pb-[180px]" // Added padding-bottom to make space for the fixed Pomodoro widget
        )}
      >
        {children}
      </main>

      <div
        className={cn(
          "fixed bottom-4 right-4 z-[1000] transition-transform duration-300 ease-in-out",
          isChatOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]" // Adjust based on chat panel width
        )}
      >
        <ChatPanel
          isOpen={isChatOpen}
          onToggleOpen={() => setIsChatOpen(!isChatOpen)}
          onNewUnreadMessage={handleNewUnreadMessage}
          onClearUnreadMessages={handleClearUnreadMessages}
          unreadCount={unreadChatCount}
        />
      </div>

      <PomodoroWidget
        isMinimized={isPomodoroMinimized}
        setIsMinimized={setIsPomodoroMinimized}
        onClose={() => {
          /* Pomodoro widget no longer has a close button, only minimize */
        }}
        chatPanelWidth={chatPanelWidth}
      />

      <SpotifyEmbedModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <Toaster />
    </div>
  );
}