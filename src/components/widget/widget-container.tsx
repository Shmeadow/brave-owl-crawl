"use client";

import React from "react";
import { Widget } from "./widget";
import { SpacesPanel } from "@/components/panels/spaces-panel";
import { SoundsPanel } from "@/components/panels/sounds-panel";
import { CalendarPanel } from "@/components/panels/calendar-panel";
import { TimerPanel } from "@/components/panels/timer-panel";
import { NotesPanel } from "@/components/panels/notes-panel";
import { MediaPanel } from "@/components/panels/media-panel";
import { FortunePanel } from "@/components/panels/fortune-panel";
import { BreathePanel } from "@/components/panels/breathe-panel";
import { FlashCardsPanel } from "@/components/panels/flash-cards-panel";
import { GoalFocusPanel } from "@/components/panels/goal-focus-panel";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { useWidget } from "./widget-context";

// Define initial configurations for all widgets
const WIDGET_CONFIGS = {
  "spaces": { initialPosition: { x: 100, y: 100 }, initialWidth: 600, initialHeight: 700 },
  "sounds": { initialPosition: { x: 750, y: 100 }, initialWidth: 500, initialHeight: 600 },
  "calendar": { initialPosition: { x: 100, y: 150 }, initialWidth: 800, initialHeight: 700 },
  "timer": { initialPosition: { x: 950, y: 150 }, initialWidth: 400, initialHeight: 400 },
  "tasks": { initialPosition: { x: 100, y: 200 }, initialWidth: 500, initialHeight: 600 },
  "notes": { initialPosition: { x: 650, y: 200 }, initialWidth: 500, initialHeight: 600 },
  "media": { initialPosition: { x: 100, y: 250 }, initialWidth: 600, initialHeight: 500 },
  "fortune": { initialPosition: { x: 750, y: 250 }, initialWidth: 400, initialHeight: 300 },
  "breathe": { initialPosition: { x: 100, y: 300 }, initialWidth: 400, initialHeight: 300 },
  "flash-cards": { initialPosition: { x: 550, y: 300 }, initialWidth: 900, initialHeight: 700 },
  "goal-focus": { initialPosition: { x: 100, y: 350 }, initialWidth: 500, initialHeight: 600 },
};

export function WidgetContainer() {
  const { widgetStates, updateWidgetPosition } = useWidget();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const widgetId = active.id.toString().replace('draggable-', ''); // Extract original ID

    const currentWidgetState = widgetStates[widgetId];
    if (currentWidgetState) {
      const newX = currentWidgetState.x + delta.x;
      const newY = currentWidgetState.y + delta.y;
      updateWidgetPosition(widgetId, newX, newY);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      {Object.entries(WIDGET_CONFIGS).map(([id, config]) => (
        <Widget
          key={id}
          id={id}
          title={id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          initialPosition={config.initialPosition}
          initialWidth={config.initialWidth}
          initialHeight={config.initialHeight}
        >
          {id === "spaces" && <SpacesPanel />}
          {id === "sounds" && <SoundsPanel />}
          {id === "calendar" && <CalendarPanel />}
          {id === "timer" && <TimerPanel />}
          {id === "tasks" && <GoalFocusPanel />} {/* Tasks now points to GoalFocusPanel */}
          {id === "notes" && <NotesPanel />}
          {id === "media" && <MediaPanel />}
          {id === "fortune" && <FortunePanel />}
          {id === "breathe" && <BreathePanel />}
          {id === "flash-cards" && <FlashCardsPanel />}
          {id === "goal-focus" && <GoalFocusPanel />}
        </Widget>
      ))}
    </DndContext>
  );
}