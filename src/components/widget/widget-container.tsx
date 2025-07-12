"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Gamepad2, BookOpen, Goal, WandSparkles, BarChart2 } from "lucide-react"; // Added BarChart2
import dynamic from 'next/dynamic'; // Import dynamic

// Import all widget content components dynamically
const DynamicSpacesWidget = dynamic(() => import("@/components/spaces-widget/spaces-widget").then(mod => mod.SpacesWidget));
const DynamicSoundsWidget = dynamic(() => import("@/components/widget-content/sounds-widget").then(mod => mod.SoundsWidget));
const DynamicCalendarWidget = dynamic(() => import("@/components/widget-content/calendar-widget").then(mod => mod.CalendarWidget));
const DynamicTimerWidget = dynamic(() => import("@/components/widget-content/timer-widget").then(mod => mod.TimerWidget));
const DynamicTasksWidget = dynamic(() => import("@/components/widget-content/tasks-widget").then(mod => mod.TasksWidget));
const DynamicNotesWidget = dynamic(() => import("@/components/widget-content/notes-widget").then(mod => mod.NotesWidget));
const DynamicMediaWidget = dynamic(() => import("@/components/widget-content/media-widget").then(mod => mod.MediaWidget));
const DynamicStatsProgressWidget = dynamic(() => import("@/components/widget-content/stats-progress-widget").then(mod => mod.StatsProgressWidget));
const DynamicFlashCardsWidget = dynamic(() => import("@/components/widget-content/flash-cards-widget").then(mod => mod.FlashCardsWidget));
const DynamicGoalFocusWidget = dynamic(() => import("@/components/widget-content/goal-focus-widget").then(mod => mod.GoalFocusWidget));
const DynamicBackgroundEffectsWidget = dynamic(() => import("@/components/widget-content/background-effects-widget").then(mod => mod.BackgroundEffectsWidget));

import { useWidget } from "./widget-provider";
import { Widget } from "./widget";
import { WidgetState } from "@/hooks/widgets/types"; // Import WidgetState
import { cn } from "@/lib/utils"; // Import cn for styling
// PinnedWidgetsDock is now rendered outside this container in AppWrapper

// Define WIDGET_COMPONENTS at the top level
const WIDGET_COMPONENTS = {
  "spaces": { icon: LayoutGrid, content: DynamicSpacesWidget, title: "Spaces" },
  "sounds": { icon: Volume2, content: DynamicSoundsWidget, title: "Sounds" },
  "calendar": { icon: Calendar, content: DynamicCalendarWidget, title: "Calendar" },
  "timer": { icon: Timer, content: DynamicTimerWidget, title: "Timer" },
  "tasks": { icon: ListTodo, content: DynamicTasksWidget, title: "Tasks" },
  "notes": { icon: NotebookPen, content: DynamicNotesWidget, title: "Notes" },
  "media": { icon: Image, content: DynamicMediaWidget, title: "Media" },
  "stats-progress": { icon: BarChart2, content: DynamicStatsProgressWidget, title: "Stats & Progress" }, // Renamed from games
  "flash-cards": { icon: BookOpen, content: DynamicFlashCardsWidget, title: "Flash Cards" },
  "goal-focus": { icon: Goal, content: DynamicGoalFocusWidget, title: "Goal Focus" },
  "background-effects": { icon: WandSparkles, content: DynamicBackgroundEffectsWidget, title: "Backgrounds" },
};

interface WidgetContainerProps {
  isCurrentRoomWritable: boolean;
  mainContentArea: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  isMobile: boolean; // New prop
}

export function WidgetContainer({ isCurrentRoomWritable, mainContentArea, isMobile }: WidgetContainerProps) {
  const {
    activeWidgets, // Now contains ALL widgets
    updateWidgetPosition,
    updateWidgetSize,
    bringWidgetToFront,
    maximizeWidget,
    togglePinned,
    closeWidget,
    topmostZIndex,
  } = useWidget();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const widgetId = active.data.current?.id;
    const initialPosition = active.data.current?.initialPosition;

    if (widgetId && initialPosition) {
      const newPosition = {
        x: initialPosition.x + delta.x,
        y: initialPosition.y + delta.y,
      };
      updateWidgetPosition(widgetId, newPosition);
    }
  };

  // Filter out pinned widgets as they are rendered in PinnedWidgetsDock
  const floatingWidgets = activeWidgets.filter((widget: WidgetState) => !widget.isPinned);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={cn(
        "w-full h-full", // Base styling for the container
        isMobile ? "flex flex-col items-center gap-4 pointer-events-auto" : "fixed inset-0 z-[903] pointer-events-none"
      )}>
        {floatingWidgets.map((widget: WidgetState) => {
          const WidgetIcon = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS]?.icon;
          const WidgetContent = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS]?.content;
          const widgetTitle = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS]?.title || widget.title;

          if (!WidgetIcon || !WidgetContent) {
            console.warn(`No component found for widget ID: ${widget.id}`);
            return null;
          }

          const isTopmost = !widget.isMinimized && !widget.isMaximized && !widget.isPinned && !widget.isClosed && widget.zIndex === topmostZIndex;

          return (
            <Widget
              key={widget.id}
              id={widget.id}
              title={widgetTitle}
              icon={WidgetIcon}
              content={WidgetContent}
              position={widget.position}
              size={widget.size}
              zIndex={widget.zIndex}
              isMinimized={widget.isMinimized}
              isMaximized={widget.isMaximized}
              isPinned={widget.isPinned}
              isClosed={widget.isClosed} // Pass isClosed prop
              isTopmost={isTopmost}
              onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)}
              onBringToFront={() => bringWidgetToFront(widget.id)}
              onMaximize={maximizeWidget}
              onPin={togglePinned}
              onClose={closeWidget}
              isCurrentRoomWritable={isCurrentRoomWritable}
              mainContentArea={mainContentArea}
              isMobile={isMobile}
              isInsideDock={false} // Explicitly not inside dock
            />
          );
        })}
      </div>
    </DndContext>
  );
}