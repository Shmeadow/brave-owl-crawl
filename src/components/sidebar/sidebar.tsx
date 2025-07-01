"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-context"; // Import useWidget
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Sparkles, Wind, BookOpen, Goal } from "lucide-react";

const SIDEBAR_WIDTH = 60; // px
const HEADER_HEIGHT_REM = 4; // 4rem = 64px

export function Sidebar() {
  const { activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { toggleWidget } = useWidget(); // Get toggleWidget from WidgetContext
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Removed all mouse event listeners and hover logic.
  // The sidebar's open/close state is now controlled externally (e.g., by a button in the Header).

  const navItems = [
    { id: "spaces", label: "Spaces", icon: LayoutGrid },
    { id: "sounds", label: "Sounds", icon: Volume2 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "timer", label: "Timer", icon: Timer },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "notes", label: "Notes", icon: NotebookPen },
    { id: "media", label: "Media", icon: Image },
    { id: "fortune", label: "Fortune", icon: Sparkles },
    { id: "breathe", label: "Breathe", icon: Wind },
    { id: "flash-cards", label: "Flash Cards", icon: BookOpen },
    { id: "goal-focus", label: "Goal Focus", icon: Goal },
  ];

  const handleSidebarItemClick = (id: string, label: string) => {
    setActivePanel(id as any); // Keep activePanel for highlighting
    toggleWidget(id, label); // Toggle the corresponding widget
  };

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed left-0 top-16 z-50 flex flex-col items-center py-4",
        "bg-black/60 shadow-lg shadow-black/30 transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0 w-[60px]" : "-translate-x-full w-[60px]", // Fully hide when closed
        `h-[calc(100vh-${HEADER_HEIGHT_REM}rem)]`, // Adjusted height
        "rounded-r-lg" // Added rounded right corners
      )}
      // Removed onMouseEnter and onMouseLeave
    >
      <div className="flex flex-col gap-2 overflow-y-auto h-full">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePanel === item.id}
            onClick={() => handleSidebarItemClick(item.id, item.label)}
          />
        ))}
      </div>
    </div>
  );
}