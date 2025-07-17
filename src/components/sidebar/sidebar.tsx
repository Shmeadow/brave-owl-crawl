"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-provider";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, Palette, Image, BarChart2, BookOpen, Goal, WandSparkles, BookText } from "lucide-react";

const SIDEBAR_WIDTH = 60; // px
const HEADER_HEIGHT_REM = 4; // 4rem = 64px

export function Sidebar() {
  const { activePanel, setActivePanel } = useSidebar();
  const { toggleWidget } = useWidget();

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

  return (
    <div
      className={cn(
        "fixed top-16 left-0 z-[902] flex flex-col items-center py-4",
        "bg-card/60 backdrop-blur-xl border border-white/40 rounded-lg shadow-xl",
        `h-[calc(100vh-${HEADER_HEIGHT_REM}rem)]`
      )}
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      <div className="flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePanel === item.id}
            onClick={() => handleSidebarItemClick(item.id, item.label)}
            isExpanded={false} // Sidebar is never expanded in this version
          />
        ))}
      </div>
    </div>
  );
}