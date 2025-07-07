"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Widget } from "@/components/widget/widget";
import { WidgetState } from "@/hooks/widgets/types";
import { useWidget } from "@/components/widget/widget-provider";
import { DOCKED_WIDGET_WIDTH, DOCKED_WIDGET_HEIGHT, DOCKED_WIDGET_HORIZONTAL_GAP, BOTTOM_DOCK_OFFSET } from "@/hooks/widgets/types";
import { useIsMobile } from "@/hooks/use-mobile";

// Define WIDGET_COMPONENTS here or import from a central place if available
// For now, re-define necessary parts for this component's scope
const WIDGET_COMPONENTS_MAP = {
  "spaces": { icon: LayoutGrid, content: () => null }, // Content is not rendered here, just icon
  "sounds": { icon: LayoutGrid, content: () => null },
  "calendar": { icon: LayoutGrid, content: () => null },
  "timer": { icon: LayoutGrid, content: () => null },
  "tasks": { icon: LayoutGrid, content: () => null },
  "notes": { icon: LayoutGrid, content: () => null },
  "media": { icon: LayoutGrid, content: () => null },
  "games": { icon: LayoutGrid, content: () => null },
  "flash-cards": { icon: LayoutGrid, content: () => null },
  "goal-focus": { icon: LayoutGrid, content: () => null },
  "background-effects": { icon: LayoutGrid, content: () => null },
};

interface PinnedWidgetsDockProps {
  pinnedWidgets: WidgetState[];
  mainContentArea: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export function PinnedWidgetsDock({ pinnedWidgets, mainContentArea }: PinnedWidgetsDockProps) {
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
  const dockWidth = pinnedWidgets.length * (DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP) + DOCKED_WIDGET_HORIZONTAL_GAP;

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
        // Position is not relevant for rendering inside the dock, but needed for unpinning
        const widgetRelativePosition = {
          x: index * (DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP),
          y: 0,
        };

        return (
          <Widget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            icon={WidgetIcon}
            content={() => null} // Content is not rendered here, only in main container
            position={widgetRelativePosition} // Position relative to dock
            size={{ width: DOCKED_WIDGET_WIDTH, height: DOCKED_WIDGET_HEIGHT }}
            zIndex={widget.zIndex} // Keep original zIndex for consistency, though less relevant here
            isMinimized={true} // Always minimized when pinned
            isMaximized={false}
            isPinned={true}
            isTopmost={false} // Not topmost in the traditional sense
            onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)}
            onBringToFront={() => bringWidgetToFront(widget.id)}
            onMinimize={minimizeWidget}
            onMaximize={maximizeWidget}
            onPin={togglePinned} // This will unpin the widget
            onClose={closeWidget}
            isCurrentRoomWritable={true} // Pinned widgets are always interactive
            mainContentArea={mainContentArea} // Pass main content area for unpinning calculations
            isMobile={isMobile}
            isInsideDock={true} // Indicate it's inside the dock
          />
        );
      })}
    </Card>
  );
}