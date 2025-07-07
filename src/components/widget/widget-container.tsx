"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Gamepad2, BookOpen, Goal, WandSparkles } from "lucide-react";

// Import all widget content components
import { SpacesWidget } from "@/components/widget-content/spaces-widget";
import { SoundsWidget } from "@/components/widget-content/sounds-widget";
import { CalendarWidget } from "@/components/widget-content/calendar-widget";
import { TimerWidget } from "@/components/widget-content/timer-widget";
import { TasksWidget } from "@/components/widget-content/tasks-widget";
import { NotesWidget } from "@/components/widget-content/notes-widget";
import { MediaWidget } from "@/components/widget-content/media-widget";
import { GamesWidget } from "@/components/widget-content/games-widget";
import { FlashCardsWidget } from "@/components/widget-content/flash-cards-widget";
import { GoalFocusWidget } from "@/components/widget-content/goal-focus-widget";
import { BackgroundEffectsWidget } from "@/components/widget-content/background-effects-widget";
import { useWidget } from "./widget-provider";
import { Widget } from "./widget";
import { WidgetState } from "@/hooks/widgets/types"; // Import WidgetState
import { cn } from "@/lib/utils"; // Import cn for styling
// PinnedWidgetsDock is now rendered outside this container in AppWrapper

// Define WIDGET_COMPONENTS at the top level
const WIDGET_COMPONENTS = {
  "spaces": { icon: LayoutGrid, content: SpacesWidget, title: "Spaces" },
  "sounds": { icon: Volume2, content: SoundsWidget, title: "Sounds" },
  "calendar": { icon: Calendar, content: CalendarWidget, title: "Calendar" },
  "timer": { icon: Timer, content: TimerWidget, title: "Timer" },
  "tasks": { icon: ListTodo, content: TasksWidget, title: "Tasks" },
  "notes": { icon: NotebookPen, content: NotesWidget, title: "Notes" },
  "media": { icon: Image, content: MediaWidget, title: "Media" },
  "games": { icon: Gamepad2, content: GamesWidget, title: "Games" },
  "flash-cards": { icon: BookOpen, content: FlashCardsWidget, title: "Flash Cards" },
  "goal-focus": { icon: Goal, content: GoalFocusWidget, title: "Goal Focus" },
  "background-effects": { icon: WandSparkles, content: BackgroundEffectsWidget, title: "Backgrounds" },
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
    minimizeWidget,
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
              onMinimize={minimizeWidget}
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