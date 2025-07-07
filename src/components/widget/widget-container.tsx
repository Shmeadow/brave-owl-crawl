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
import { PinnedWidgetsDock } from "@/components/pinned-widgets-dock"; // Import the new dock component

// Define WIDGET_COMPONENTS at the top level
const WIDGET_COMPONENTS = {
  "spaces": { icon: LayoutGrid, content: SpacesWidget },
  "sounds": { icon: Volume2, content: SoundsWidget },
  "calendar": { icon: Calendar, content: CalendarWidget },
  "timer": { icon: Timer, content: TimerWidget },
  "tasks": { icon: ListTodo, content: TasksWidget },
  "notes": { icon: NotebookPen, content: NotesWidget },
  "media": { icon: Image, content: MediaWidget },
  "games": { icon: Gamepad2, content: GamesWidget },
  "flash-cards": { icon: BookOpen, content: FlashCardsWidget },
  "goal-focus": { icon: Goal, content: GoalFocusWidget },
  "background-effects": { icon: WandSparkles, content: BackgroundEffectsWidget },
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
    activeWidgets,
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

  // Separate floating and pinned widgets
  const floatingWidgets = activeWidgets.filter((widget: WidgetState) => !widget.isPinned);
  const pinnedWidgets = activeWidgets.filter((widget: WidgetState) => widget.isPinned);

  // Filter out minimized/pinned widgets if on mobile, as they will be hidden
  const visibleFloatingWidgets = isMobile
    ? floatingWidgets.filter((widget: WidgetState) => !widget.isMinimized && !widget.isMaximized) // On mobile, only show normal/maximized floating widgets
    : floatingWidgets; // On desktop, show all floating widgets (minimized ones are just smaller)

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={cn(
        "w-full h-full", // Base styling for the container
        isMobile ? "flex flex-col items-center gap-4 pointer-events-auto" : "fixed inset-0 z-[903] pointer-events-none"
      )}>
        {visibleFloatingWidgets.map((widget: WidgetState) => {
          const WidgetIcon = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS]?.icon;
          const WidgetContent = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS]?.content;

          if (!WidgetIcon || !WidgetContent) {
            console.warn(`No component found for widget ID: ${widget.id}`);
            return null;
          }

          const isTopmost = !widget.isMinimized && !widget.isMaximized && !widget.isPinned && widget.zIndex === topmostZIndex;

          return (
            <Widget
              key={widget.id}
              id={widget.id}
              title={widget.title}
              icon={WidgetIcon}
              content={WidgetContent}
              position={widget.position}
              size={widget.size}
              zIndex={widget.zIndex}
              isMinimized={widget.isMinimized}
              isMaximized={widget.isMaximized}
              isPinned={widget.isPinned}
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
      {/* Render the PinnedWidgetsDock outside the DndContext if it manages its own draggable/resizable */}
      {/* Or, if it's just a visual container, keep it here. */}
      {/* For now, it's a visual container that renders its own Widgets */}
      <PinnedWidgetsDock
        pinnedWidgets={pinnedWidgets}
        mainContentArea={mainContentArea}
      />
    </DndContext>
  );
}