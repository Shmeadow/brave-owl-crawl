"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize, Maximize, Pin, PinOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from "@/components/resizable-box";

interface WidgetProps {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ElementType;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onPositionChange: (newPosition: { x: number; y: number }) => void;
  onSizeChange: (newSize: { width: number; height: number }) => void;
  onBringToFront: () => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onPin: (id: string) => void;
  onClose: (id: string) => void;
}

export function Widget({
  id,
  title,
  icon: Icon,
  content: Content,
  isMinimized,
  isMaximized,
  isPinned,
  position,
  size,
  zIndex,
  onPositionChange,
  onSizeChange,
  onBringToFront,
  onMinimize,
  onMaximize,
  onPin,
  onClose,
}: WidgetProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `widget-${id}`,
    data: { id, type: "widget" },
    disabled: isPinned || isMaximized || isMinimized, // Disable dragging if pinned, maximized, or floating minimized
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const dragStyle = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  useEffect(() => {
    if (transform && cardRef.current && !isPinned && !isMaximized && !isMinimized) {
      onPositionChange({ x: position.x + transform.x, y: position.y + transform.y });
    }
  }, [transform, id, onPositionChange, position, isPinned, isMaximized, isMinimized]);

  // Determine if the widget is in a "visually minimized" state (either floating minimized or pinned)
  const isVisuallyMinimized = isMinimized || isPinned;

  const isResizable = !isMaximized && !isVisuallyMinimized; // Only resizable if not maximized and not visually minimized
  const isDraggable = !isMaximized && !isVisuallyMinimized; // Only draggable if not maximized and not visually minimized

  return (
    <Card
      ref={cardRef}
      className={cn(
        "absolute bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
        // Sizing based on state
        isMaximized ? "inset-0 w-full h-full" : "", // Maximize takes full screen
        isVisuallyMinimized && !isPinned ? "w-56 h-12" : "", // Floating minimized fixed size
        isPinned ? "w-[192px] h-[48px]" : "", // Pinned fixed size (DOCKED_WIDGET_WIDTH, DOCKED_WIDGET_HEIGHT)
        !isMaximized && !isVisuallyMinimized && !isPinned ? `w-[${size.width}px] h-[${size.height}px]` : "", // Default size if normal

        // Cursor and resize behavior
        isResizable ? "resize overflow-auto cursor-grab" : "",
        isPinned ? "cursor-default" : "",
        isVisuallyMinimized && !isPinned ? "cursor-pointer" : "", // Floating minimized is clickable to restore
        "z-50",
        "pointer-events-auto"
      )}
      style={{
        left: isMaximized ? undefined : position.x,
        top: isMaximized ? undefined : position.y,
        zIndex: zIndex,
        ...dragStyle
      }}
      onClick={isVisuallyMinimized && !isPinned ? () => onMinimize(id) : undefined} // Only expand floating minimized on click
      onMouseDown={onBringToFront}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          isVisuallyMinimized && !isPinned ? "hidden" : "flex" // Hide header only for floating minimized
        )}
        {...(isDraggable && { ...listeners, ...attributes })} // Only draggable if in normal state
      >
        <CardTitle className="text-lg font-medium leading-none">
          {title}
        </CardTitle>
        <div className="flex gap-1">
          {!isPinned && (
            <>
              {isMinimized ? ( // If floating minimized, show maximize to restore
                <Button variant="ghost" size="icon" onClick={() => onMinimize(id)} title="Restore">
                  <Maximize className="h-4 w-4" />
                </Button>
              ) : isMaximized ? ( // If maximized, show minimize to restore
                <Button variant="ghost" size="icon" onClick={() => onMaximize(id)} title="Restore">
                  <Minimize className="h-4 w-4" />
                </Button>
              ) : ( // If normal, show both minimize and maximize
                <>
                  <Button variant="ghost" size="icon" onClick={() => onMinimize(id)} title="Minimize">
                    <Minimize className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onMaximize(id)} title="Maximize">
                    <Maximize className="h-4 w-4" />
                  </Button>
                </>
              )}
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => onPin(id)} title={isPinned ? "Unpin" : "Pin"}>
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onClose(id)} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {isVisuallyMinimized ? ( // If visually minimized (floating or pinned)
        <div className={cn(
          "flex items-center justify-start gap-2 px-3 py-2 h-full w-full",
          isPinned ? "flex" : "flex" // Always show content for pinned, and for floating minimized
        )}>
          <Icon className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium truncate">{title}</span>
        </div>
      ) : ( // Normal or maximized state
        <ResizableBox
          width={size.width}
          height={size.height}
          onResizeStop={(e, direction, ref, d) => {
            if (isResizable) {
              onSizeChange({ width: size.width + d.width, height: size.height + d.height });
            }
          }}
          minConstraints={[200, 150]}
          maxConstraints={[window.innerWidth, window.innerHeight]}
          className={cn(
            "flex-grow flex flex-col",
            isMaximized || isPinned ? "w-full h-full" : "" // Pinned widgets are not resizable, but their content area should fill
          )}
          handle={null} // Always hide react-resizable's own handles
        >
          <CardContent className="flex-grow p-0 overflow-hidden">
            <Content />
          </CardContent>
        </ResizableBox>
      )}
    </Card>
  );
}