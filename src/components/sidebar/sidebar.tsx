"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-provider";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, Palette, Image, BarChart2, BookOpen, Goal, WandSparkles, BookText } from "lucide-react";
import { MOBILE_HORIZONTAL_SIDEBAR_HEIGHT, MOBILE_HEADER_EFFECTIVE_HEIGHT, MOBILE_HEADER_SIDEBAR_GAP } from "@/lib/constants";

const SIDEBAR_WIDTH_DESKTOP = 48;
const HEADER_HEIGHT_REM = 4;

interface SidebarProps {
  isMobile: boolean;
}

export function Sidebar({ isMobile }: SidebarProps) {
  const { activePanel, setActivePanel, setIsSidebarOpen } = useSidebar();
  const { toggleWidget } = useWidget();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSidebarOpen(true);
  }, [setIsSidebarOpen]);

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
  };

  const isExpanded = false;

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed z-[9999] flex", // Increased z-index for debugging
        "bg-red-500 border border-white/40 shadow-xl", // Added red background for visibility
        "transition-all duration-300 ease-in-out",
        isMobile ?
          `top-[80px] left-0 right-0 flex-row justify-around p-0.5 gap-0.5 rounded-none overflow-x-auto` : // Hardcoded top for debugging
          "top-1/2 -translate-y-1/2 left-2 rounded-full p-1 gap-1 flex-col"
      )}
      style={isMobile ? { height: `${MOBILE_HORIZONTAL_SIDEBAR_HEIGHT}px`, width: '100%' } : { width: `${SIDEBAR_WIDTH_DESKTOP}px` }}
    >
      <div className={cn("flex", isMobile ? "flex-row" : "flex-col", "gap-1")}>
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