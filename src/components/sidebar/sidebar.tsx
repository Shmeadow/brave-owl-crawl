"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Home, Settings, Bell, Users, Calendar, Book, Lightbulb, MessageSquare, Goal, Brain, Music, Image, SunMoon, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWidget } from "@/components/widget/widget-context";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Sidebar() {
  const { openWidget } = useWidget();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: Users, label: "Community", href: "/community" },
  ];

  const widgetItems = [
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "notes", icon: Book, label: "Notes" },
    { id: "timer", icon: Lightbulb, label: "Timer" },
    { id: "chat", icon: MessageSquare, label: "Chat" }, // Assuming chat widget exists
    { id: "goals", icon: Goal, label: "Goals" }, // Assuming goals widget exists
    { id: "flash-cards", icon: Brain, label: "Flashcards" },
    { id: "sounds", icon: Music, label: "Sounds" },
    { id: "media", icon: Image, label: "Media" },
    { id: "fortune", icon: Sparkles, label: "Fortune" },
    { id: "breathe", icon: SunMoon, label: "Breathe" },
    { id: "spaces", icon: Home, label: "Spaces" }, // Re-using Home icon for Spaces
    { id: "goal-focus", icon: Goal, label: "Goal Focus" }, // Re-using Goal icon for Goal Focus
  ];

  return (
    <aside className="flex flex-col items-center py-4 px-2 border-r bg-background h-full justify-end"> {/* Added justify-end */}
      <nav className="flex flex-col gap-2"> {/* Removed flex-grow */}
        {navItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Link href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
        <div className="border-t my-2 w-full" />
        {widgetItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => openWidget(item.id, item.label)}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </aside>
  );
}