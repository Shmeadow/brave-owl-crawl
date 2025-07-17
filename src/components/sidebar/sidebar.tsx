"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-provider";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, Palette, Image, BarChart2, BookOpen, Goal, WandSparkles, BookText } from "lucide-react";

const SIDEBAR_WIDTH_DESKTOP = 60; // px
const SIDEBAR_WIDTH_EXPANDED = 250; // px
const SIDEBAR_WIDTH_MOBILE = 250; // px
const HEADER_HEIGHT_REM = 4; // 4rem = 64px

interface SidebarProps {
  isMobile: boolean;
}

export function Sidebar({ isMobile }: SidebarProps) {
  const { activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { toggleWidget } = useWidget();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile, setIsSidebarOpen]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, setIsSidebarOpen]);

  useEffect(() => {
    if (isMobile) {
      // On mobile, the sidebar state is controlled by the hamburger menu in the header.
      // We don't want hover effects.
      return;
    }
    // On desktop, we reset the state to closed when the mobile status changes.
    setIsSidebarOpen(false);
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
    : (isSidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_DESKTOP);

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed top-16 z-[1001] flex flex-col items-center py-4",
        "bg-card/60 backdrop-blur-xl border border-white/40 rounded-r-lg shadow-xl",
        "transition-all duration-300 ease-in-out",
        `h-[calc(100vh-${HEADER_HEIGHT_REM}rem)]`,
        isMobile
          ? `${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`
          : ""
      )}
      style={{ width: `${sidebarWidth}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePanel === item.id}
            onClick={() => handleSidebarItemClick(item.id, item.label)}
            isExpanded={isSidebarOpen}
          />
        ))}
      </div>
      <div className="mt-auto pt-4">
        {/* Docking button removed */}
      </div>
    </div>
  );
}