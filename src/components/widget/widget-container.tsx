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
      <Widget id="spaces" title="Spaces" initialPosition={{ x: 100, y: 100 }} initialWidth={600} initialHeight={700}>
        <SpacesPanel />
      </Widget>
      <Widget id="sounds" title="Ambient Sounds & Music" initialPosition={{ x: 750, y: 100 }} initialWidth={500} initialHeight={600}>
        <SoundsPanel />
      </Widget>
      <Widget id="calendar" title="Your Calendar" initialPosition={{ x: 100, y: 150 }} initialWidth={800} initialHeight={700}>
        <CalendarPanel />
      </Widget>
      <Widget id="timer" title="Time Tracker" initialPosition={{ x: 950, y: 150 }} initialWidth={400} initialHeight={400}>
        <TimerPanel />
      </Widget>
      <Widget id="tasks" title="Your Goals" initialPosition={{ x: 100, y: 200 }} initialWidth={500} initialHeight={600}>
        <GoalFocusPanel /> {/* Tasks now points to GoalFocusPanel */}
      </Widget>
      <Widget id="notes" title="Your Notes" initialPosition={{ x: 650, y: 200 }} initialWidth={500} initialHeight={600}>
        <NotesPanel />
      </Widget>
      <Widget id="media" title="Media Gallery" initialPosition={{ x: 100, y: 250 }} initialWidth={600} initialHeight={500}>
        <MediaPanel />
      </Widget>
      <Widget id="fortune" title="Fortune Teller" initialPosition={{ x: 750, y: 250 }} initialWidth={400} initialHeight={300}>
        <FortunePanel />
      </Widget>
      <Widget id="breathe" title="Breathe" initialPosition={{ x: 100, y: 300 }} initialWidth={400} initialHeight={300}>
        <BreathePanel />
      </Widget>
      <Widget id="flash-cards" title="Flash Cards" initialPosition={{ x: 550, y: 300 }} initialWidth={900} initialHeight={700}>
        <FlashCardsPanel />
      </Widget>
      <Widget id="goal-focus" title="Goal Focus" initialPosition={{ x: 100, y: 350 }} initialWidth={500} initialHeight={600}>
        <GoalFocusPanel />
      </Widget>
    </>
  );
}