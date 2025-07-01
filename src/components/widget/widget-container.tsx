"use client";

import React from "react";
import { Widget } from "./widget";
import { useWidget } from "./widget-context";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Sparkles, Wind, BookOpen, Goal } from "lucide-react";

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

// Map widget IDs to their components and icons
const WIDGET_COMPONENTS = {
  "spaces": { icon: LayoutGrid, content: SpacesWidget },
  "sounds": { icon: Volume2, content: SoundsWidget },
  "calendar": { icon: Calendar, content: CalendarWidget },
  "timer": { icon: Timer, content: TimerWidget },
  "tasks": { icon: ListTodo, content: TasksWidget },
  "notes": { icon: NotebookPen, content: NotesWidget },
  "media": { icon: Image, content: MediaWidget },
  "fortune": { icon: Sparkles, content: FortuneWidget },
  "breathe": { icon: Wind, content: BreatheWidget },
  "flash-cards": { icon: BookOpen, content: FlashCardsWidget },
  "goal-focus": { icon: Goal, content: GoalFocusWidget },
};

export function WidgetContainer() {
  const {
    activeWidgets,
    updateWidgetPosition,
    updateWidgetSize,
    bringWidgetToFront,
    minimizeWidget,
    maximizeWidget, // Added
    togglePinned, // Renamed
    closeWidget,
  } = useWidget();

  return (
    <div className="fixed inset-0 z-[900] pointer-events-none"> {/* Re-added pointer-events-none, adjusted z-index */}
      {activeWidgets.map(widget => {
        const WidgetIcon = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS]?.icon;
        const WidgetContent = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS]?.content;

        if (!WidgetIcon || !WidgetContent) {
          console.warn(`No component found for widget ID: ${widget.id}`);
          return null;
        }

        return (
          <Widget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            icon={WidgetIcon} // Pass icon
            content={WidgetContent} // Pass content
            position={widget.position}
            size={widget.size}
            zIndex={widget.zIndex}
            isMinimized={widget.isMinimized}
            isMaximized={widget.isMaximized} // Pass isMaximized
            isPinned={widget.isPinned} // Pass isPinned
            isOpen={true} // Active widgets are always open
            onPositionChange={(newPos) => updateWidgetPosition(widget.id, newPos)} // Renamed
            onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)} // Renamed
            onBringToFront={() => bringWidgetToFront(widget.id)}
            onMinimize={minimizeWidget}
            onMaximize={maximizeWidget} // Pass maximizeWidget
            onPin={togglePinned} // Pass togglePinned
            onClose={closeWidget}
          />
        );
      })}
    </div>
  );
}