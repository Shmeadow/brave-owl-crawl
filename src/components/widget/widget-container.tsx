"use client";

import React from "react";
import { Widget } from "./widget";
import { useWidget } from "./widget-context";

// Import all widget content components
import { SpacesWidget } from "@/components/widget-content/spaces-widget";
import { SoundsWidget } from "@/components/widget-content/sounds-widget";
import { CalendarWidget } from "@/components/widget-content/calendar-widget";
import { TimerWidget } from "@/components/widget-content/timer-widget";
import { TasksWidget } from "@/components/widget-content/tasks-widget";
import { NotesWidget } from "@/components/widget-content/notes-widget";
import { MediaWidget } from "@/components/widget-content/media-widget";
import { FortuneWidget } from "@/components/widget-content/fortune-widget";
import { BreatheWidget } from "@/components/widget-content/breathe-widget";
import { FlashCardsWidget } from "@/components/widget-content/flash-cards-widget";
import { GoalFocusWidget } from "@/components/widget-content/goal-focus-widget";

export function WidgetContainer() {
  const {
    activeWidgets,
    updateWidgetPosition,
    updateWidgetSize,
    bringWidgetToFront,
    minimizeWidget,
    closeWidget,
    toggleDocked,
  } = useWidget();

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none"> {/* Re-added pointer-events-none */}
      {activeWidgets.map(widget => (
        <Widget
          key={widget.id}
          id={widget.id}
          title={widget.title}
          position={widget.position}
          size={widget.size}
          zIndex={widget.zIndex}
          onPositionChange={(newPos) => updateWidgetPosition(widget.id, newPos)}
          onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)}
          onBringToFront={() => bringWidgetToFront(widget.id)}
          isMinimized={widget.isMinimized}
          onMinimize={minimizeWidget}
          onClose={closeWidget}
          isDocked={widget.isDocked}
          toggleDocked={toggleDocked}
        >
          {/* Render content based on widget.id */}
          {widget.id === "spaces" && <SpacesWidget />}
          {widget.id === "sounds" && <SoundsWidget />}
          {widget.id === "calendar" && <CalendarWidget />}
          {widget.id === "timer" && <TimerWidget />}
          {widget.id === "tasks" && <TasksWidget />}
          {widget.id === "notes" && <NotesWidget />}
          {widget.id === "media" && <MediaWidget />}
          {widget.id === "fortune" && <FortuneWidget />}
          {widget.id === "breathe" && <BreatheWidget />}
          {widget.id === "flash-cards" && <FlashCardsWidget />}
          {widget.id === "goal-focus" && <GoalFocusWidget />}
        </Widget>
      ))}
    </div>
  );
}