"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { useSidebar } from "./sidebar-context";
import { useWidget } from "@/components/widget/widget-context";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Sparkles, BookOpen, Goal, ChevronLeft, ChevronRight } from "lucide-react";

const SIDEBAR_WIDTH = 60; // px
const HOT_ZONE_WIDTH = 20; // px (includes the 4px visible strip)
const UNDOCK_DELAY = 500; // ms
const HEADER_HEIGHT_REM = 4; // 4rem = 64px

export function Sidebar() {
  const { activePanel, setActivePanel, isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { toggleWidget } = useWidget();
  const { isAlwaysOpen, toggleAlwaysOpen, mounted } = useSidebarPreference(); // Get mounted state
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (isAlwaysOpen) return;

    if (e.clientX < HOT_ZONE_WIDTH && !isSidebarOpenRef.current) {
      handleMouseEnter();
    } 
    else if (e.clientX >= SIDEBAR_WIDTH && isSidebarOpenRef.current && !sidebarRef.current?.contains(e.target as Node)) {
      handleMouseLeave();
    }
  }, [isAlwaysOpen, handleMouseEnter, handleMouseLeave]);

  useEffect(() => {
    if (isAlwaysOpen) {
      setIsSidebarOpen(true);
      document.removeEventListener('mousemove', handleMouseMove);
    } else {
      setIsSidebarOpen(false);
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAlwaysOpen, handleMouseMove, setIsSidebarOpen]);

  const navItems = [
    { id: "spaces", label: "Spaces", icon: LayoutGrid },
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
  };

  // Ensure actualSidebarOpen is consistent on server (always false initially)
  const actualSidebarOpen = mounted ? (isAlwaysOpen || isSidebarOpen) : false;

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
    >
      <div className="flex flex-col gap-2 overflow-y-auto">
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
      <div className="mt-auto pt-4">
        <SidebarItem
          // Conditionally render icon and label based on mounted state
          icon={mounted && isAlwaysOpen ? ChevronLeft : ChevronRight}
          label={mounted && isAlwaysOpen ? "Undock Sidebar" : "Dock Sidebar"}
          isActive={false}
          onClick={toggleAlwaysOpen}
        />
      </div>
    </div>
  );
}