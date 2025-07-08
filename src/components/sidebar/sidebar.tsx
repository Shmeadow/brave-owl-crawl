"use client";

import React, { useEffect } from "react";
import { YStack, Separator } from "tamagui";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-provider";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Gamepad2, BookOpen, Goal, ChevronLeft, ChevronRight, WandSparkles } from "lucide-react";

const SIDEBAR_WIDTH_DESKTOP = 80; // px
const SIDEBAR_WIDTH_EXPANDED = 220; // px
const SIDEBAR_WIDTH_MOBILE = 200; // px
const HEADER_HEIGHT_REM = 4; // 4rem = 64px

interface SidebarProps {
  isMobile: boolean;
}

export function Sidebar({ isMobile }: SidebarProps) {
  const { activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { toggleWidget } = useWidget();
  const { isAlwaysOpen, toggleAlwaysOpen, mounted } = useSidebarPreference();

  useEffect(() => {
    if (isMobile) {
      // On mobile, the sidebar is an overlay controlled by the hamburger menu
      // No automatic open/close logic needed
    } else {
      // On desktop, the sidebar is either docked (always open) or not
      setIsSidebarOpen(isAlwaysOpen);
    }
  }, [isAlwaysOpen, isMobile, setIsSidebarOpen]);

  const navItems = [
    { id: "background-effects", label: "Backgrounds", icon: WandSparkles },
    { id: "sounds", label: "Sounds", icon: Volume2 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "timer", label: "Timer", icon: Timer },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "notes", label: "Notes", icon: NotebookPen },
    { id: "media", label: "Media", icon: Image },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "flash-cards", label: "Flash Cards", icon: BookOpen },
    { id: "goal-focus", label: "Goal Focus", icon: Goal },
  ];

  const handleSidebarItemClick = (id: string, label: string) => {
    setActivePanel(id as any);
    toggleWidget(id, label);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const actualSidebarOpen = mounted && (isMobile ? isSidebarOpen : isAlwaysOpen);

  return (
    <YStack
      position="fixed"
      top="$16"
      left={0}
      zIndex={1001} // Ensure it's above background effects but below header
      paddingVertical="$4"
      alignItems="center"
      gap="$2"
      backgroundColor="rgba(10, 10, 10, 0.5)"
      backdropFilter="blur(16px)"
      borderRightWidth={1}
      borderColor="$gray8"
      height={`calc(100vh - ${HEADER_HEIGHT_REM}rem)`}
      width={isMobile ? SIDEBAR_WIDTH_MOBILE : (isAlwaysOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_DESKTOP)}
      transform={isMobile ? (isSidebarOpen ? "translateX(0%)" : "translateX(-100%)") : "translateX(0%)"}
      transition="all 0.3s ease-in-out"
    >
      <YStack gap="$2" overflow="scroll" flex={1} width="100%" alignItems="center">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePanel === item.id}
            onClick={() => handleSidebarItemClick(item.id, item.label)}
            isExpanded={actualSidebarOpen}
          />
        ))}
      </YStack>
      <Separator />
      <YStack>
        {!isMobile && (
          <SidebarItem
            icon={mounted && isAlwaysOpen ? ChevronLeft : ChevronRight}
            label={mounted && isAlwaysOpen ? "Undock Sidebar" : "Dock Sidebar"}
            isActive={false}
            onClick={toggleAlwaysOpen}
            isExpanded={actualSidebarOpen}
          />
        )}
      </YStack>
    </YStack>
  );
}