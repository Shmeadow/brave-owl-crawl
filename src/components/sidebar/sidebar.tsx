"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference"; // Import useSidebarPreference
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Sparkles, Wind, BookOpen, Goal, ChevronLeft, ChevronRight } from "lucide-react"; // Added ChevronLeft, ChevronRight

const SIDEBAR_WIDTH = 60; // px
const HOT_ZONE_WIDTH = 20; // px (includes the 4px visible strip)
const UNDOCK_DELAY = 500; // ms
const HEADER_HEIGHT_REM = 4; // 4rem = 64px

export function Sidebar() {
  const { activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAlwaysOpen, toggleAlwaysOpen } = useSidebarPreference(); // Get the preference and toggle function
  const { toggleWidget } = useWidget();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to hold the latest isSidebarOpen state for event listeners
  const isSidebarOpenRef = useRef(isSidebarOpen);
  useEffect(() => {
    isSidebarOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen]);

  const handleMouseEnter = useCallback(() => {
    if (isAlwaysOpen) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSidebarOpen(true);
  }, [isAlwaysOpen, setIsSidebarOpen]);

  const handleMouseLeave = useCallback(() => {
    if (isAlwaysOpen) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, UNDOCK_DELAY);
  }, [isAlwaysOpen, setIsSidebarOpen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isAlwaysOpen) return; // If always open, mouse events don't control it

    // Check if mouse is in the hot zone and sidebar is currently closed
    if (e.clientX < HOT_ZONE_WIDTH && !isSidebarOpenRef.current) {
      handleMouseEnter();
    } 
    // Check if mouse is outside the sidebar area and sidebar is currently open
    else if (e.clientX >= SIDEBAR_WIDTH && isSidebarOpenRef.current && !sidebarRef.current?.contains(e.target as Node)) {
      handleMouseLeave();
    }
  }, [isAlwaysOpen, handleMouseEnter, handleMouseLeave]); // Dependencies for handleMouseMove

  useEffect(() => {
    if (isAlwaysOpen) {
      setIsSidebarOpen(true); // Force open if preference is true
      document.removeEventListener('mousemove', handleMouseMove); // Remove hover listener
    } else {
      setIsSidebarOpen(false); // Explicitly close the sidebar when "always open" is turned off
      document.addEventListener('mousemove', handleMouseMove); // Add hover listener
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAlwaysOpen, handleMouseMove, setIsSidebarOpen]); // Re-run effect if preference or handleMouseMove changes

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
    setActivePanel(id as any);
    toggleWidget(id, label);
  };

  const actualSidebarOpen = isAlwaysOpen || isSidebarOpen; // Determine actual visual state

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed left-0 top-16 z-50 flex flex-col items-center py-4",
        "bg-sidebar backdrop-blur-xl shadow-lg shadow-black/30 transition-transform duration-300 ease-in-out",
        actualSidebarOpen ? "translate-x-0 w-[60px]" : "-translate-x-full w-[60px]",
        `h-[calc(100vh-${HEADER_HEIGHT_REM}rem)]`,
        "rounded-r-lg"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      {/* New docking toggle button */}
      <div className="mt-auto pt-4"> {/* Pushes button to the bottom */}
        <SidebarItem
          icon={isAlwaysOpen ? ChevronLeft : ChevronRight} // Icon changes based on docked state
          label={isAlwaysOpen ? "Undock Sidebar" : "Dock Sidebar"}
          isActive={false} // This button is not a panel selector
          onClick={toggleAlwaysOpen} // Toggles the always open preference
        />
      </div>
    </div>
  );
}