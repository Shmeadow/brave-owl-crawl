"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, Palette, Image, Gamepad2, BookOpen, Goal, WandSparkles, BarChart2, BookText } from "lucide-react"; // Changed NotebookPen to Palette
import dynamic from 'next/dynamic'; // Import dynamic

// Import all widget content components dynamically with SSR disabled
const DynamicSpacesWidget = dynamic(() => import("@/components/widget-content/spaces-widget").then(mod => mod.SpacesWidget), { ssr: false });
const DynamicSoundsWidget = dynamic(() => import("@/components/widget-content/sounds-widget").then(mod => mod.SoundsWidget), { ssr: false });
const DynamicCalendarWidget = dynamic(() => import("@/components/widget-content/calendar-widget").then(mod => mod.CalendarWidget), { ssr: false });
const DynamicTimerWidget = dynamic(() => import("@/components/widget-content/timer-widget").then(mod => mod.TimerWidget), { ssr: false });
const DynamicTasksWidget = dynamic(() => import("@/components/widget-content/tasks-widget").then(mod => mod.TasksWidget), { ssr: false });
const DynamicDrawingBoardWidget = dynamic(() => import("@/components/widget-content/drawing-board-widget").then(mod => mod.DrawingBoardWidget), { ssr: false });
const DynamicJournalWidget = dynamic(() => import("@/components/widget-content/journal-widget").then(mod => mod.JournalWidget), { ssr: false }); // New Journal Widget
const DynamicMediaWidget = dynamic(() => import("@/components/widget-content/media-widget").then(mod => mod.MediaWidget), { ssr: false });
const DynamicStatsProgressWidget = dynamic(() => import("@/components/widget-content/stats-progress-widget").then(mod => mod.StatsProgressWidget), { ssr: false });
const DynamicFlashCardsWidget = dynamic(() => import("@/components/widget-content/flash-cards-widget").then(mod => mod.FlashCardsWidget), { ssr: false });
const DynamicGoalFocusWidget = dynamic(() => import("@/components/widget-content/goal-focus-widget").then(mod => mod.GoalFocusWidget), { ssr: false });
const DynamicBackgroundEffectsWidget = dynamic(() => import("@/components/widget-content/background-effects-widget").then(mod => mod.BackgroundEffectsWidget), { ssr: false });

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
  "drawing-board": { icon: Palette, content: DynamicDrawingBoardWidget, title: "Drawing Board" },
  "journal": { icon: BookText, content: DynamicJournalWidget, title: "Journal" }, // New Journal Widget
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