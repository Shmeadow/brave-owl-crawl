"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// Removed ScrollArea and ScrollBar as it will be a vertical list

interface DashboardTabsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "spaces", label: "Spaces" },
  { id: "sounds", label: "Sounds" },
  { id: "cal", label: "Cal" },
  { id: "timer", label: "Timer" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "media", label: "Media" },
  { id: "fortune", label: "Fortune" },
  { id: "breathe", label: "Breathe" },
];

export function DashboardTabsSidebar({ activeTab, onTabChange }: DashboardTabsSidebarProps) {
  return (
    <div className="flex flex-col h-full w-full border-r border-border bg-card/80 backdrop-blur-md">
      <div className="flex flex-col gap-1 p-2 pt-4"> {/* Vertical layout with padding */}
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "justify-start px-3 py-2 text-sm font-medium transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-accent",
              activeTab === tab.id && "text-foreground bg-accent",
              // Remove after pseudo-element for vertical tabs
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
}