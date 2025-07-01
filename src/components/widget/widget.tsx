"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize, Maximize, Pin, PinOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from "@/components/resizable-box";

interface WidgetProps {
  id: string; // Changed from WidgetId to string
  title: string;
  icon: React.ElementType;
  content: React.ElementType;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  isOpen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onPositionChange: (newPosition: { x: number; y: number }) => void;
  onSizeChange: (newSize: { width: number; height: number }) => void;
  onBringToFront: () => void;
  onMinimize: (id: string) => void; // Changed from WidgetId to string
  onMaximize: (id: string) => void; // Changed from WidgetId to string
  onPin: (id: string) => void; // Changed from WidgetId to string
  onClose: (id: string) => void; // Changed from WidgetId to string
}

export function Widget({
  id,
  title,
  icon: Icon,
  content: Content,
  isMinimized,
  isMaximized,
  isPinned,
  isOpen,
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
  });

  const cardRef = useRef<HTMLDivElement>(null);

  // Apply drag transform directly
  const dragStyle = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  // Handle drag end
  useEffect(() => {
    // Only update position if actually dragged and not in a fixed state
    if (transform && cardRef.current && !isPinned && !isMaximized && !isMinimized) {
      onPositionChange({ x: position.x + transform.x, y: position.y + transform.y });
    }
  }, [transform, id, onPositionChange, position, isPinned, isMaximized, isMinimized]);


  const renderCardContent = () => {
    if (isMinimized) {
      return (
        <div className="flex items-center justify-center h-full w-full">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      );
    }
    return (
      <CardContent className="flex-grow p-0 overflow-hidden">
        <Content />
      </CardContent>
    );
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        "absolute bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
        isMaximized ? "inset-0 w-full h-full" : "",
        isMinimized ? "w-56 h-12" : `w-[${size.width}px] h-[${size.height}px]`,
        isPinned ? "relative !w-auto !h-auto" : "", // Pinned widgets are relative, not absolute
        isPinned && !isMinimized && !isMaximized ? "flex-grow" : "", // Pinned and normal size
        // Apply 'resize' class only if it's in a normal, floating, resizable state
        (!isPinned && !isMaximized && !isMinimized) ? "resize overflow-auto" : "",
        (!isPinned && !isMaximized && !isMinimized) ? "cursor-grab" : "", // Draggable only if floating and not minimized/maximized
        isPinned ? "cursor-default" : "",
        isMinimized ? "cursor-pointer" : "",
        "z-50",
        "pointer-events-auto" // Enable pointer events on the card itself
      )}
      style={{
        left: isMaximized || isPinned ? undefined : position.x,
        top: isMaximized || isPinned ? undefined : position.y,
        width: isMaximized || isPinned ? undefined : size.width,
        height: isMaximized || isPinned ? undefined : size.height,
        zIndex: zIndex,
        ...dragStyle
      }}
      onClick={isMinimized ? () => onMinimize(id) : undefined}
      onMouseDown={onBringToFront}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          isMinimized ? "hidden" : "flex"
        )}
        {...(!isPinned && !isMaximized && !isMinimized && { ...listeners, ...attributes })}
      >
        <CardTitle className="text-lg font-medium leading-none">
          {title}
        </CardTitle>
        <div className="flex gap-1">
          {!isPinned && ( // Only show minimize/maximize/restore if not pinned
            <>
              {isMinimized ? (
                // If minimized, show a button to restore (which is handled by onMinimize)
                <Button variant="ghost" size="icon" onClick={() => onMinimize(id)} title="Restore">
                  <Maximize className="h-4 w-4" />
                </Button>
              ) : isMaximized ? (
                // If maximized, show a button to restore (which is handled by onMaximize)
                <Button variant="ghost" size="icon" onClick={() => onMaximize(id)} title="Restore">
                  <Minimize className="h-4 w-4" />
                </Button>
              ) : (
                // If normal, show both minimize and maximize buttons
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

      {!isMinimized && ( // Only render ResizableBox content if not minimized
        <ResizableBox
          width={size.width}
          height={size.height}
          onResizeStop={(e, direction, ref, d) => {
            if (!isMaximized && !isPinned) { // Only allow resizing if not maximized or pinned
              onSizeChange({ width: size.width + d.width, height: size.height + d.height });
            }
          }}
          minConstraints={[200, 150]}
          maxConstraints={[window.innerWidth, window.innerHeight]}
          className={cn(
            "flex-grow flex flex-col",
            isMaximized || isPinned ? "w-full h-full" : ""
          )}
          // Always pass handle={null} to remove the visual lines (react-resizable's handles)
          handle={null}
        >
          {renderCardContent()}
        </ResizableBox>
      )}
    </Card>
  );
}