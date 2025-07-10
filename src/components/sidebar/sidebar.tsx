"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-provider";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, BarChart2, BookOpen, Goal, ChevronLeft, ChevronRight, WandSparkles } from "lucide-react";

const SIDEBAR_WIDTH_DESKTOP = 60; // px
const SIDEBAR_WIDTH_EXPANDED = 120; // px - New width for expanded desktop sidebar (reduced from 180)
const HOT_ZONE_WIDTH = 20; // px (includes the 4px visible strip)
const SIDEBAR_WIDTH_MOBILE = 250; // px - Define a width for mobile sidebar
const UNDOCK_DELAY = 500; // ms
const HEADER_HEIGHT_REM = 4; // 4rem = 64px

interface SidebarProps {
  isMobile: boolean; // New prop
}

export function Sidebar({ isMobile }: SidebarProps) {
  const { activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { toggleWidget } = useWidget();
  const { isAlwaysOpen, toggleAlwaysOpen, mounted } = useSidebarPreference();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track the current state of isSidebarOpen for mousemove listener
  const isSidebarOpenRef = useRef(isSidebarOpen);
  useEffect(() => {
    isSidebarOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen]);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return; // Disable hot zone for mobile
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSidebarOpen(true);
  }, [isMobile, setIsSidebarOpen]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return; // Disable hot zone for mobile
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, UNDOCK_DELAY);
  }, [isMobile, setIsSidebarOpen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isMobile || isAlwaysOpen) return; // Disable hot zone for mobile or if always open

    if (e.clientX < HOT_ZONE_WIDTH && !isSidebarOpenRef.current) {
      handleMouseEnter();
    } 
    else if (e.clientX >= SIDEBAR_WIDTH_DESKTOP && isSidebarOpenRef.current && !sidebarRef.current?.contains(e.target as Node)) {
      handleMouseLeave();
    }
  }, [isMobile, isAlwaysOpen, handleMouseEnter, handleMouseLeave]);

  useEffect(() => {
    if (!isMobile) { // Only apply desktop hot zone logic on desktop
      if (isAlwaysOpen) {
        setIsSidebarOpen(true); // If docked, ensure it's open
        document.removeEventListener('mousemove', handleMouseMove); // No hot zone if docked
      } else {
        setIsSidebarOpen(false); // If undocked, ensure it's closed initially
        document.addEventListener('mousemove', handleMouseMove); // Enable hot zone
      }
    } else {
      // On mobile, remove desktop listeners
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // isSidebarOpen state for mobile is managed by SidebarProvider's initial state and Header's toggle
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAlwaysOpen, handleMouseMove, setIsSidebarOpen, isMobile]);

  const navItems = [
    { id: "background-effects", label: "Backgrounds", icon: WandSparkles },
    { id: "sounds", label: "Sounds", icon: Volume2 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "timer", label: "Timer", icon: Timer },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "notes", label: "Notes", icon: NotebookPen },
    { id: "media", label: "Media", icon: Image },
    { id: "flash-cards", label: "Flash Cards", icon: BookOpen },
    { id: "goal-focus", label: "Goal Focus", icon: Goal },
  ];

  const handleSidebarItemClick = (id: string, label: string) => {
    setActivePanel(id as any);
    toggleWidget(id, label);
    // On mobile, clicking an item should close the sidebar
    if (isMobile) {
      setIsSidebarOpen(false); 
    }
  };

  // Determine actual sidebar width based on state
  const sidebarWidth = isMobile
    ? SIDEBAR_WIDTH_MOBILE
    : (isAlwaysOpen ? SIDEBAR_WIDTH_DESKTOP : (isSidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_DESKTOP));

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed top-16 z-[902] flex flex-col items-center py-2", // Reduced py-4 to py-2
        "bg-card/40 backdrop-blur-xl border-white/20 rounded-lg", // Added new container styles
        "transition-transform duration-300 ease-in-out",
        `h-[calc(100vh-${HEADER_HEIGHT_REM}rem)]`,
        isMobile
          ? `${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}` // Mobile: controlled by isSidebarOpen
          : `${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}` // Desktop: controlled by isSidebarOpen
      )}
      style={{ width: `${sidebarWidth}px` }} // Apply dynamic width here
      onMouseEnter={!isMobile && !isAlwaysOpen ? handleMouseEnter : undefined}
      onMouseLeave={!isMobile && !isAlwaysOpen ? handleMouseLeave : undefined}
    >
      <div className="flex flex-col gap-1 overflow-y-auto"> {/* Reduced gap-2 to gap-1 */}
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePanel === item.id}
            onClick={() => handleSidebarItemClick(item.id, item.label)}
            isExpanded={isSidebarOpen} // Pass the expanded state
          />
        ))}
      </div>
      <div className="mt-auto pt-2"> {/* Reduced pt-4 to pt-2 */}
        {!isMobile && ( // Only show dock/undock button on desktop
          <SidebarItem
            icon={mounted && isAlwaysOpen ? ChevronLeft : ChevronRight}
            label={mounted && isAlwaysOpen ? "Undock Sidebar" : "Dock Sidebar"}
            isActive={false}
            onClick={toggleAlwaysOpen}
            isExpanded={isSidebarOpen} // Pass the expanded state
          />
        )}
      </div>
    </div>
  );
}