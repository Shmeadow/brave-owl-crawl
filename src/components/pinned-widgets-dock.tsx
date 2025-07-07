"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, LayoutGrid } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate the position of the dock itself
  const dockPosition = {
    left: mainContentArea.left + DOCKED_WIDGET_HORIZONTAL_GAP,
    bottom: BOTTOM_DOCK_OFFSET,
  };

  // Calculate the width of the dock based on the number of pinned widgets
  const dockWidth = pinnedWidgets.length * (DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP) + DOCKED_WIDGET_HORIZONTAL_GAP;

  if (isMobile) {
    return null; // Pinned widgets are not displayed on mobile in this manner
  }

  if (pinnedWidgets.length === 0) {
    return null; // Don't render the dock if no widgets are pinned
  }

  return (
    <Card
      className={cn(
        "fixed z-[902] bg-background/60 backdrop-blur-xl border-white/20 shadow-lg rounded-lg p-2 transition-all duration-300 ease-in-out",
        "flex flex-col items-start",
        isExpanded ? "h-auto" : "h-12", // Adjust height based on expansion
      )}
      style={{
        left: dockPosition.left,
        bottom: dockPosition.bottom,
        width: isExpanded ? `${dockWidth}px` : 'auto', // Auto width when collapsed to fit button
        minWidth: isExpanded ? `${DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP * 2}px` : 'auto',
      }}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Pinned Widgets</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse Pinned Widgets" : "Expand Pinned Widgets"}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="flex flex-wrap gap-2 w-full">
          {pinnedWidgets.map((widget, index) => {
            const WidgetIcon = WIDGET_COMPONENTS_MAP[widget.id as keyof typeof WIDGET_COMPONENTS_MAP]?.icon;
            // Calculate position relative to the dock for rendering
            const widgetRelativePosition = {
              x: index * (DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP),
              y: 0, // Widgets are laid out horizontally within the dock
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
                onPin={togglePinned}
                onClose={closeWidget}
                isCurrentRoomWritable={true} // Pinned widgets are always interactive
                mainContentArea={mainContentArea} // Pass main content area for unpinning calculations
                isMobile={isMobile}
                isInsideDock={true} // Indicate it's inside the dock
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}