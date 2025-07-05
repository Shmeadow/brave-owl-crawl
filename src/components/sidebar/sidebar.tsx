"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Sparkles, BookOpen, Goal, ChevronLeft, ChevronRight, WandSparkles } from "lucide-react";

const SIDEBAR_WIDTH_DESKTOP = 60; // px
const SIDEBAR_WIDTH_EXPANDED = 120; // px - New width for expanded desktop sidebar (reduced from 180)
const SIDEBAR_WIDTH_MOBILE = 200; // px for the off-canvas menu
const HOT_ZONE_WIDTH = 20; // px (includes the 4px visible strip)
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

  const isSidebarOpenRef = useRef(isSidebarOpen);
  useEffect(() => {
    isSidebarOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen]);

  const handleMouseEnter = useCallback(() => {
    if (isAlwaysOpen || isMobile) return; // Disable hot zone for mobile
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSidebarOpen(true);
  }, [isAlwaysOpen, isMobile, setIsSidebarOpen]);

  const handleMouseLeave = useCallback(() => {
    if (isAlwaysOpen || isMobile) return; // Disable hot zone for mobile
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, UNDOCK_DELAY);
  }, [isAlwaysOpen, isMobile, setIsSidebarOpen]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isAlwaysOpen || isMobile) return; // Disable hot zone for mobile

    if (e.clientX < HOT_ZONE_WIDTH && !isSidebarOpenRef.current) {
      handleMouseEnter();
    } 
    else if (e.clientX >= SIDEBAR_WIDTH_DESKTOP && isSidebarOpenRef.current && !sidebarRef.current?.contains(e.target as Node)) {
      handleMouseLeave();
    }
  }, [isAlwaysOpen, isMobile, handleMouseEnter, handleMouseLeave]);

  useEffect(() => {
    if (isMobile) {
      // On mobile, remove desktop hot zone listener
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Sidebar state on mobile is controlled by hamburger menu
    } else {
      // On desktop, apply hot zone logic
      if (isAlwaysOpen) {
        setIsSidebarOpen(true);
        document.removeEventListener('mousemove', handleMouseMove);
      } else {
        setIsSidebarOpen(false);
        document.addEventListener('mousemove', handleMouseMove);
      }
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
    { id: "fortune", label: "Fortune", icon: Sparkles },
    { id: "flash-cards", label: "Flash Cards", icon: BookOpen },
    { id: "goal-focus", label: "Goal Focus", icon: Goal },
  ];

  const handleSidebarItemClick = (id: string, label: string) => {
    setActivePanel(id as any);
    toggleWidget(id, label);
    if (isMobile) {
      setIsSidebarOpen(false); // Close sidebar after selecting item on mobile
    }
  };

  // Determine actual sidebar open state for visual rendering
  const actualSidebarOpen = mounted ? (isMobile ? isSidebarOpen : (isAlwaysOpen || isSidebarOpen)) : false;

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed top-16 z-[902] flex flex-col items-center py-4",
        "bg-transparent backdrop-blur-xl shadow-lg shadow-black/30 transition-transform duration-300 ease-in-out",
        `h-[calc(100vh-${HEADER_HEIGHT_REM}rem)]`,
        "rounded-r-lg",
        isMobile
          ? `w-[${SIDEBAR_WIDTH_MOBILE}px] ${actualSidebarOpen ? "translate-x-0" : "-translate-x-full"}` // Mobile off-canvas
          : `w-[${actualSidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_DESKTOP}px] ${actualSidebarOpen ? "translate-x-0" : "-translate-x-full"}` // Desktop fixed
      )}
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
            isExpanded={actualSidebarOpen} // Pass the expanded state
          />
        ))}
      </div>
      <div className="mt-auto pt-4">
        {!isMobile && ( // Only show dock/undock button on desktop
          <SidebarItem
            icon={mounted && isAlwaysOpen ? ChevronLeft : ChevronRight}
            label={mounted && isAlwaysOpen ? "Undock Sidebar" : "Dock Sidebar"}
            isActive={false}
            onClick={toggleAlwaysOpen}
            isExpanded={actualSidebarOpen} // Pass the expanded state
          />
        )}
      </div>
    </div>
  );
}