"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { SidebarItem } from "@/components/sidebar/sidebar-item";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Sparkles, Wind, BookOpen, Goal } from "lucide-react";

// Define navigation items and their icons
const NAV_ITEMS = {
  "spaces": { label: "Spaces", icon: LayoutGrid },
  "sounds": { label: "Sounds", icon: Volume2 },
  "calendar": { label: "Calendar", icon: Calendar },
  "timer": { label: "Timer", icon: Timer },
  "tasks": { label: "Tasks", icon: ListTodo },
  "notes": { label: "Notes", icon: NotebookPen },
  "media": { label: "Media", icon: Image },
  "fortune": { label: "Fortune", icon: Sparkles },
  "breathe": { label: "Breathe", icon: Wind },
  "flash-cards": { label: "Flash Cards", icon: BookOpen },
  "goal-focus": { label: "Goal Focus", icon: Goal },
};

const SIDEBAR_WIDTH_CLOSED = 60; // Matches the constant in AppWrapper
const SIDEBAR_WIDTH_OPEN = 200; // Expanded width on hover/always open

export function Sidebar() {
  const { activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAlwaysOpen } = useSidebarPreference();

  const currentWidth = isAlwaysOpen || isSidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-50 flex flex-col py-4",
        "bg-card backdrop-blur-xl border-white/20",
        "h-[calc(100vh-4rem)] overflow-y-auto",
        "transition-all duration-300 ease-in-out",
        `w-[${currentWidth}px]`, // Dynamic width
        "group" // For hover effects
      )}
      onMouseEnter={() => !isAlwaysOpen && setIsSidebarOpen(true)}
      onMouseLeave={() => !isAlwaysOpen && setIsSidebarOpen(false)}
    >
      <nav className="flex flex-col items-center gap-4 px-2">
        {Object.entries(NAV_ITEMS).map(([id, { label, icon }]) => (
          <SidebarItem
            key={id}
            icon={icon}
            label={label}
            isActive={activePanel === id}
            onClick={() => setActivePanel(id as any)}
          />
        ))}
      </nav>
    </aside>
  );
}