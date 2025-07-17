"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-provider";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, Palette, Image, BarChart2, BookOpen, Goal, WandSparkles, BookText } from "lucide-react";

const SIDEBAR_WIDTH_DESKTOP = 60; // px
const SIDEBAR_WIDTH_MOBILE = 250; // px
const HEADER_HEIGHT_REM = 4; // 4rem = 64px

interface SidebarProps {
  isMobile: boolean;
}

export function Sidebar({ isMobile }: SidebarProps) {
  const { activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { toggleWidget } = useWidget();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // On desktop, the sidebar is always visually collapsed.
    // On mobile, the state is controlled by the hamburger menu.
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, setIsSidebarOpen]);

  const navItems = [
    { id: "background-effects", label: "Backgrounds", icon: WandSparkles },
    { id: "sounds", label: "Sounds", icon: Volume2 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "timer", label: "Timer", icon: Timer },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "drawing-board", label: "Drawing Board", icon: Palette },
    { id: "journal", label: "Journal", icon: BookText },
    { id: "media", label: "Media", icon: Image },
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

  const sidebarWidth = isMobile
    ? (isSidebarOpen ? SIDEBAR_WIDTH_MOBILE : 0)
    : SIDEBAR_WIDTH_DESKTOP;

  // The sidebar is only visually "expanded" with text on mobile when it's open
  const isExpanded = isMobile && isSidebarOpen;

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed z-[1001] flex flex-col",
        "bg-card/60 backdrop-blur-xl border border-white/40 shadow-xl",
        "transition-all duration-300 ease-in-out",
        // Mobile-specific styles
        isMobile && `top-16 h-[calc(100vh-${HEADER_HEIGHT_REM}rem)] rounded-r-lg py-4 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`,
        // Desktop-specific styles
        !isMobile && "top-1/2 -translate-y-1/2 left-4 rounded-full p-2 gap-2"
      )}
      style={isMobile ? { width: `${sidebarWidth}px` } : {}}
    >
      <div className="flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePanel === item.id}
            onClick={() => handleSidebarItemClick(item.id, item.label)}
            isExpanded={isExpanded}
          />
        ))}
      </div>
    </div>
  );
}