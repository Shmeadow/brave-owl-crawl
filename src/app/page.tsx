"use client";

import React from "react";
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
    <div className="flex flex-col min-h-screen w-full pt-16 pr-80"> {/* Added pr-80 for fixed chat */}
      <div className="flex-1 p-4 overflow-y-auto">
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
      </div>
    </div>
  );
}