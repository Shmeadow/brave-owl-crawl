"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, Palette, Image, Gamepad2, BookOpen, Goal, WandSparkles, BarChart2, BookText } from "lucide-react";
import dynamic from 'next/dynamic';

// Define a function to get widget components.
// This ensures dynamic imports are processed within the component's lifecycle.
const getWidgetComponentsMap = () => ({
  "spaces": { icon: LayoutGrid, content: dynamic(() => import("@/components/widget-content/spaces-widget").then(mod => mod.SpacesWidget), { ssr: false }), title: "Spaces" },
  "sounds": { icon: Volume2, content: dynamic(() => import("@/components/widget-content/sounds-widget").then(mod => mod.SoundsWidget), { ssr: false }), title: "Sounds" },
  "calendar": { icon: Calendar, content: dynamic(() => import("@/components/widget-content/calendar-widget").then(mod => mod.CalendarWidget), { ssr: false }), title: "Calendar" },
  "timer": { icon: Timer, content: dynamic(() => import("@/components/widget-content/timer-widget").then(mod => mod.TimerWidget), { ssr: false }), title: "Timer" },
  "tasks": { icon: ListTodo, content: dynamic(() => import("@/components/widget-content/tasks-widget").then(mod => mod.TasksWidget), { ssr: false }), title: "Tasks" },
  "drawing-board": { icon: Palette, content: dynamic(() => import("@/components/widget-content/drawing-board-widget").then(mod => mod.DrawingBoardWidget), { ssr: false }), title: "Drawing Board" },
  "journal": { icon: BookText, content: dynamic(() => import("@/components/widget-content/journal-widget").then(mod => mod.JournalWidget), { ssr: false }), title: "Journal" },
  "media": { icon: Image, content: dynamic(() => import("@/components/widget-content/media-widget").then(mod => mod.MediaWidget), { ssr: false }), title: "Media" },
  "stats-progress": { icon: BarChart2, content: dynamic(() => import("@/components/widget-content/stats-progress-widget").then(mod => mod.StatsProgressWidget), { ssr: false }), title: "Stats & Progress" },
  "flash-cards": { icon: BookOpen, content: dynamic(() => import("@/components/widget-content/flash-cards-widget").then(mod => mod.FlashCardsWidget), { ssr: false }), title: "Flash Cards" },
  "goal-focus": { icon: Goal, content: dynamic(() => import("@/components/widget-content/goal-focus-widget").then(mod => mod.GoalFocusWidget), { ssr: false }), title: "Goal Focus" },
  "background-effects": { icon: WandSparkles, content: dynamic(() => import("@/components/widget-content/background-effects-widget").then(mod => mod.BackgroundEffectsWidget), { ssr: false }), title: "Backgrounds" },
});

import { useWidget } from "./widget-provider";
import { Widget } from "./widget";
import { WidgetState } from "@/hooks/widgets/types";
import { cn } from "@/lib/utils";

interface WidgetContainerProps {
  isCurrentRoomWritable: boolean;
  mainContentArea: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  isMobile: boolean;
}

export function WidgetContainer({ isCurrentRoomWritable, mainContentArea, isMobile }: WidgetContainerProps) {
  const {
    activeWidgets,
    updateWidgetPosition,
    updateWidgetSize,
    bringWidgetToFront,
    maximizeWidget,
    togglePinned,
    closeWidget,
    topmostZIndex,
  } = useWidget();

  const WIDGET_COMPONENTS = getWidgetComponentsMap(); // Get the map here

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

  const floatingWidgets = activeWidgets.filter((widget: WidgetState) => !widget.isPinned);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={cn(
        "w-full h-full",
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
              isClosed={widget.isClosed}
              isTopmost={isTopmost}
              onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)}
              onBringToFront={() => bringWidgetToFront(widget.id)}
              onMaximize={maximizeWidget}
              onPin={togglePinned}
              onClose={closeWidget}
              isCurrentRoomWritable={isCurrentRoomWritable}
              mainContentArea={mainContentArea}
              isMobile={isMobile}
              isInsideDock={false}
            />
          );
        })}
      </div>
    </DndContext>
  );
}