"use client";

import React from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel } from "@/components/chat-panel";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSidebar } from "@/components/sidebar/sidebar-context"; // Import useSidebar
import { SpacesPanel } from "@/components/panels/spaces-panel";
import { SoundsPanel } from "@/components/panels/sounds-panel";
import { CalendarPanel } from "@/components/panels/calendar-panel";
import { TimerPanel } from "@/components/panels/timer-panel";
import { TasksPanel } from "@/components/panels/tasks-panel";
import { NotesPanel } from "@/components/panels/notes-panel";
import { MediaPanel } from "@/components/panels/media-panel";
import { FortunePanel } from "@/components/panels/fortune-panel";
import { BreathePanel } from "@/components/panels/breathe-panel";
import { FlashCardsPanel } from "@/components/panels/flash-cards-panel";
import { GoalFocusPanel } from "@/components/panels/goal-focus-panel";
import { AnimatePresence, motion } from "framer-motion"; // For panel transitions

export default function HomePage() {
  const { activePanel } = useSidebar(); // Get activePanel from context

  // Function to render the active panel content
  const renderActivePanel = () => {
    switch (activePanel) {
      case "spaces":
        return <SpacesPanel />;
      case "sounds":
        return <SoundsPanel />;
      case "calendar":
        return <CalendarPanel />;
      case "timer":
        return <TimerPanel />;
      case "tasks":
        return <TasksPanel />;
      case "notes":
        return <NotesPanel />;
      case "media":
        return <MediaPanel />;
      case "fortune":
        return <FortunePanel />;
      case "breathe":
        return <BreathePanel />;
      case "flash-cards":
        return <FlashCardsPanel />;
      case "goal-focus":
        return <GoalFocusPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full pt-16"> {/* Padding top for fixed header */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Main Content Area (contains active panel and ChatPanel) */}
        <ResizablePanel defaultSize={65} minSize={40} className="p-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full" // Ensure motion.div takes full height
            >
              {renderActivePanel()}
            </motion.div>
          </AnimatePresence>
          <MadeWithDyad />
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors" />
        <ResizablePanel defaultSize={35} minSize={25} className="p-4">
          <ChatPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}