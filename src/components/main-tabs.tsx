"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MainTabsProps {
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

export function MainTabs({ activeTab, onTabChange }: MainTabsProps) {
  return (
    <div className="sticky top-16 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex h-12 items-center px-4 sm:px-6 gap-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative h-full rounded-none px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground",
                activeTab === tab.id && "text-foreground",
                activeTab === tab.id && "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-primary"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}