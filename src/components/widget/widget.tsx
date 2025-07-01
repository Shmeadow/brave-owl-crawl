"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize, Maximize, Pin, PinOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from "@/components/resizable-box"; // Updated import path
import { WidgetId } from "@/hooks/use-widget-state"; // Assuming WidgetId is defined here

interface WidgetProps {
  id: WidgetId;
  title: string;
  icon: React.ElementType; // Now required
  content: React.ElementType; // Now required
  isMinimized: boolean;
  isMaximized: boolean; // Now required
  isPinned: boolean; // Now required
  isOpen: boolean; // Now required (though always true when rendered)
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number; // Added zIndex prop
  onPositionChange: (newPosition: { x: number; y: number }) => void; // Renamed from onDragEnd
  onSizeChange: (newSize: { width: number; height: number }) => void; // Renamed from onResizeEnd
  onBringToFront: () => void;
  onMinimize: (id: WidgetId) => void;
  onMaximize: (id: WidgetId) => void; // Now required
  onPin: (id: WidgetId) => void; // Now required
  onClose: (id: WidgetId) => void;
}

export function Widget({
  id,
  title,
  icon: Icon, // Destructure Icon
  content: Content, // Destructure Content
  isMinimized,
  isMaximized,
  isPinned,
  isOpen, // Keep isOpen for completeness, though it's always true here
  position,
  size,
  zIndex, // Use zIndex
  onPositionChange, // Use new name
  onSizeChange, // Use new name
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
        !isPinned && !isMaximized && !isMinimized ? "resize overflow-auto" : "", // Resizable only if floating and not minimized/maximized
        !isPinned && !isMaximized && !isMinimized ? "cursor-grab" : "", // Draggable only if floating and not minimized/maximized
        isPinned ? "cursor-default" : "",
        isMinimized ? "cursor-pointer" : "",
        "z-50"
      )}
      style={{
        left: isMaximized || isPinned ? undefined : position.x,
        top: isMaximized || isPinned ? undefined : position.y,
        width: isMaximized || isPinned ? undefined : size.width,
        height: isMaximized || isPinned ? undefined : size.height,
        zIndex: zIndex, // Apply zIndex
        ...dragStyle // Apply drag transform
      }}
      onClick={isMinimized ? () => onMinimize(id) : undefined} // Only expand on click when minimized
      onMouseDown={onBringToFront} // Bring to front on any click/interaction
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          isMinimized ? "hidden" : "flex"
        )}
        {...(!isPinned && !isMaximized && !isMinimized && { ...listeners, ...attributes })} // Apply draggable props only if floating and not minimized/maximized
      >
        <CardTitle className="text-lg font-medium leading-none">
          {title}
        </CardTitle>
        <div className="flex gap-1">
          {!isPinned && ( // Only show minimize/restore if not pinned
            <Button variant="ghost" size="icon" onClick={() => onMinimize(id)} title={isMinimized ? "Restore" : "Minimize"}>
              {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
            </Button>
          )}
          {!isPinned && ( // Only show maximize/restore if not pinned
            <Button variant="ghost" size="icon" onClick={() => onMaximize(id)} title={isMaximized ? "Restore" : "Maximize"}>
              {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onPin(id)} title={isPinned ? "Unpin" : "Pin"}>
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onClose(id)} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
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
          // Disable handles if maximized or pinned
          handle={!isMaximized && !isPinned ? undefined : {}}
        >
          {renderCardContent()}
        </ResizableBox>
      )}
    </Card>
  );
}