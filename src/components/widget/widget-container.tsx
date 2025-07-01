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

const widgetContentMap: Record<string, React.ComponentType> = {
  "spaces": SpacesWidget,
  "sounds": SoundsWidget,
  "calendar": CalendarWidget,
  "timer": TimerWidget,
  "tasks": TasksWidget,
  "notes": NotesWidget,
  "media": MediaWidget,
  "fortune": FortuneWidget,
  "breathe": BreatheWidget,
  "flash-cards": FlashCardsWidget,
  "goal-focus": GoalFocusWidget,
};

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

  const floatingWidgets = activeWidgets.filter(w => !w.isDocked);
  const dockedWidgets = activeWidgets.filter(w => w.isDocked);

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
      {/* Floating Widgets */}
      {floatingWidgets.map(widget => {
        const WidgetContent = widgetContentMap[widget.id];
        return (
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
            {WidgetContent && <WidgetContent />}
          </Widget>
        );
      })}

      {/* Docked Widgets Container */}
      {dockedWidgets.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-background/80 backdrop-blur-md border-l border-border flex flex-col p-2 space-y-2 overflow-y-auto pointer-events-auto">
          <h3 className="text-lg font-semibold mb-2 text-foreground">Docked Widgets</h3>
          {dockedWidgets.map(widget => {
            const WidgetContent = widgetContentMap[widget.id];
            return (
              <Widget
                key={widget.id}
                id={widget.id}
                title={widget.title}
                position={widget.position} // These props are ignored when isDocked is true
                size={widget.size} // These props are ignored when isDocked is true
                zIndex={widget.zIndex} // This prop is ignored when isDocked is true
                onPositionChange={(newPos) => updateWidgetPosition(widget.id, newPos)}
                onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)}
                onBringToFront={() => bringWidgetToFront(widget.id)}
                isMinimized={widget.isMinimized}
                onMinimize={minimizeWidget}
                onClose={closeWidget}
                isDocked={widget.isDocked}
                toggleDocked={toggleDocked}
              >
                {WidgetContent && <WidgetContent />}
              </Widget>
            );
          })}
        </div>
      )}
    </div>
  );
}