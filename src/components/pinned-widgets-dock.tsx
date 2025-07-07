"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Volume2, Calendar, Timer, ListTodo, NotebookPen, Image, Gamepad2, BookOpen, Goal, WandSparkles } from "lucide-react"; // Import all icons
import { cn } from "@/lib/utils";
import { Widget } from "@/components/widget/widget";
import { WidgetState } from "@/hooks/widgets/types";
import { useWidget } from "@/components/widget/widget-provider";
import { DOCKED_WIDGET_WIDTH, DOCKED_WIDGET_HEIGHT, DOCKED_WIDGET_HORIZONTAL_GAP, BOTTOM_DOCK_OFFSET } from "@/hooks/widgets/types";
import { useIsMobile } from "@/hooks/use-mobile";

// Define WIDGET_COMPONENTS_MAP with actual icons
const WIDGET_COMPONENTS_MAP = {
  "spaces": { icon: LayoutGrid, content: () => null, title: "Spaces" },
  "sounds": { icon: Volume2, content: () => null, title: "Sounds" },
  "calendar": { icon: Calendar, content: () => null, title: "Calendar" },
  "timer": { icon: Timer, content: () => null, title: "Timer" },
  "tasks": { icon: ListTodo, content: () => null, title: "Tasks" },
  "notes": { icon: NotebookPen, content: () => null, title: "Notes" },
  "media": { icon: Image, content: () => null, title: "Media" },
  "games": { icon: Gamepad2, content: () => null, title: "Games" },
  "flash-cards": { icon: BookOpen, content: () => null, title: "Flash Cards" },
  "goal-focus": { icon: Goal, content: () => null, title: "Goal Focus" },
  "background-effects": { icon: WandSparkles, content: () => null, title: "Backgrounds" },
};

interface PinnedWidgetsDockProps {
  pinnedWidgets: WidgetState[];
  mainContentArea: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  isCurrentRoomWritable: boolean; // Pass this down
}

export function PinnedWidgetsDock({ pinnedWidgets, mainContentArea, isCurrentRoomWritable }: PinnedWidgetsDockProps) {
  const {
    bringWidgetToFront,
    minimizeWidget,
    maximizeWidget,
    togglePinned,
    closeWidget,
    updateWidgetPosition, // Needed for unpinning
    updateWidgetSize, // Needed for unpinning
    topmostZIndex,
  } = useWidget();
  const isMobile = useIsMobile();

  if (pinnedWidgets.length === 0) {
    return null; // Don't render the dock if no widgets are pinned
  }

  // Calculate the position of the dock itself
  const dockPosition = {
    left: mainContentArea.left + DOCKED_WIDGET_HORIZONTAL_GAP,
    bottom: BOTTOM_DOCK_OFFSET,
  };

  // Calculate the width of the dock based on the number of pinned widgets
  // Each widget is DOCKED_WIDGET_WIDTH (48px)
  // There's a gap-2 (8px) between items
  // The parent Card has p-1.5 (6px padding on each side)
  const numWidgets = pinnedWidgets.length;
  const totalWidgetsWidth = numWidgets * DOCKED_WIDGET_WIDTH;
  const totalGapWidth = numWidgets > 0 ? (numWidgets - 1) * 8 : 0; // 8px for gap-2
  const totalPaddingWidth = 2 * 6; // 6px for p-1.5 on each side
  const dockWidth = totalWidgetsWidth + totalGapWidth + totalPaddingWidth;

  return (
    <Card
      className={cn(
        "fixed z-[902] bg-background/60 backdrop-blur-xl border-white/20 shadow-lg rounded-full p-1.5 transition-all duration-300 ease-in-out",
        "flex items-center gap-2", // Changed to horizontal flex layout
      )}
      style={{
        left: dockPosition.left,
        bottom: dockPosition.bottom,
        width: `${dockWidth}px`, // Fixed width based on content
        minWidth: `${DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP * 2}px`,
      }}
    >
      {pinnedWidgets.map((widget, index) => {
        const WidgetIcon = WIDGET_COMPONENTS_MAP[widget.id as keyof typeof WIDGET_COMPONENTS_MAP]?.icon;
        const widgetTitle = WIDGET_COMPONENTS_MAP[widget.id as keyof typeof WIDGET_COMPONENTS_MAP]?.title || widget.title;
        
        // Position is not relevant for rendering inside the dock, but needed for unpinning
        const widgetRelativePosition = {
          x: index * (DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP),
          y: 0,
        };

        return (
          <Widget
            key={widget.id}
            id={widget.id}
            title={widgetTitle}
            icon={WidgetIcon}
            content={() => null} // Content is not rendered here, only in main container
            position={widgetRelativePosition} // Position relative to dock
            size={{ width: DOCKED_WIDGET_WIDTH, height: DOCKED_WIDGET_HEIGHT }}
            zIndex={widget.zIndex} // Keep original zIndex for consistency, though less relevant here
            isMinimized={true} // Always minimized when pinned
            isMaximized={false}
            isPinned={true}
            isClosed={false} // Pinned widgets are always visible
            isTopmost={false} // Not topmost in the traditional sense
            onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)}
            onBringToFront={() => bringWidgetToFront(widget.id)}
            onMinimize={minimizeWidget}
            onMaximize={maximizeWidget}
            onPin={togglePinned} // This will unpin the widget
            onClose={closeWidget}
            isCurrentRoomWritable={isCurrentRoomWritable} // Pass writability
            mainContentArea={mainContentArea} // Pass main content area for unpinning calculations
            isMobile={isMobile}
            isInsideDock={true} // Indicate it's inside the dock
          />
        );
      })}
    </Card>
  );
}