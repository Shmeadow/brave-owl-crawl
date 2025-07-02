"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useSidebar, NAV_ITEMS, ActivePanel } from "@/components/sidebar/sidebar-context"; // Import NAV_ITEMS and ActivePanel
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { SidebarItem } from "@/components/sidebar/sidebar-item";
// Removed direct lucide-react imports as NAV_ITEMS now provides them

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
            onClick={() => setActivePanel(id as ActivePanel, label)} // Pass label here
          />
        ))}
      </nav>
    </aside>
  );
}