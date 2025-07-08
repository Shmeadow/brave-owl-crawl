"use client";

import React from "react";
import { Dock, DockIcon } from "magic-ui-react";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { useWidget } from "@/components/widget/widget-provider";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Gamepad2, BookOpen, Goal, WandSparkles } from "lucide-react";

const navItems = [
  { id: "background-effects", label: "Backgrounds", icon: WandSparkles },
  { id: "sounds", label: "Sounds", icon: Volume2 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "media", label: "Media", icon: Image },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "flash-cards", label: "Flash Cards", icon: BookOpen },
  { id: "goal-focus", label: "Goal Focus", icon: Goal },
];

export function MagicDock() {
  const { setActivePanel } = useSidebar();
  const { toggleWidget } = useWidget();

  const handleItemClick = (id: string, label: string) => {
    setActivePanel(id as any);
    toggleWidget(id, label);
  };

  return (
    <div className="fixed top-1/2 -translate-y-1/2 left-4 z-[1001]">
      <Dock direction="vertical" className="bg-background/40 backdrop-blur-xl border-white/20 p-2 space-y-2">
        {navItems.map((item) => (
          <DockIcon key={item.id} onClick={() => handleItemClick(item.id, item.label)}>
            <item.icon className="h-6 w-6" />
          </DockIcon>
        ))}
      </Dock>
    </div>
  );
}