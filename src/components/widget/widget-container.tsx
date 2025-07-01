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

export function WidgetContainer() {
  return (
    <>
      <Widget id="spaces" title="Spaces" initialPosition={{ x: 100, y: 100 }} initialWidth="w-[600px]" initialHeight="h-[700px]">
        <SpacesPanel />
      </Widget>
      <Widget id="sounds" title="Ambient Sounds & Music" initialPosition={{ x: 200, y: 150 }} initialWidth="w-[500px]" initialHeight="h-[600px]">
        <SoundsPanel />
      </Widget>
      <Widget id="calendar" title="Your Calendar" initialPosition={{ x: 300, y: 200 }} initialWidth="w-[800px]" initialHeight="h-[700px]">
        <CalendarPanel />
      </Widget>
      <Widget id="timer" title="Time Tracker" initialPosition={{ x: 400, y: 250 }} initialWidth="w-[400px]" initialHeight="h-[400px]">
        <TimerPanel />
      </Widget>
      <Widget id="tasks" title="Your Goals" initialPosition={{ x: 500, y: 300 }} initialWidth="w-[500px]" initialHeight="h-[600px]">
        <GoalFocusPanel /> {/* Tasks now points to GoalFocusPanel */}
      </Widget>
      <Widget id="notes" title="Your Notes" initialPosition={{ x: 600, y: 350 }} initialWidth="w-[500px]" initialHeight="h-[600px]">
        <NotesPanel />
      </Widget>
      <Widget id="media" title="Media Gallery" initialPosition={{ x: 700, y: 400 }} initialWidth="w-[600px]" initialHeight="h-[500px]">
        <MediaPanel />
      </Widget>
      <Widget id="fortune" title="Fortune Teller" initialPosition={{ x: 800, y: 450 }} initialWidth="w-[400px]" initialHeight="h-[300px]">
        <FortunePanel />
      </Widget>
      <Widget id="breathe" title="Breathe" initialPosition={{ x: 900, y: 500 }} initialWidth="w-[400px]" initialHeight="h-[300px]">
        <BreathePanel />
      </Widget>
      <Widget id="flash-cards" title="Flash Cards" initialPosition={{ x: 100, y: 100 }} initialWidth="w-[900px]" initialHeight="h-[700px]">
        <FlashCardsPanel />
      </Widget>
      <Widget id="goal-focus" title="Goal Focus" initialPosition={{ x: 200, y: 200 }} initialWidth="w-[500px]" initialHeight="h-[600px]">
        <GoalFocusPanel />
      </Widget>
    </>
  );
}