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
    disabled: isPinned || isMaximized, // Allow dragging when minimized
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const dragStyle = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  useEffect(() => {
    // Only update position if actually dragged and not in a fixed state
    if (transform && cardRef.current && !isPinned && !isMaximized) { // Removed isMinimized from this check
      onPositionChange({ x: position.x + transform.x, y: position.y + transform.y });
    }
  }, [transform, id, onPositionChange, position, isPinned, isMaximized]);


  const renderCardContent = () => {
    // Content for minimized or pinned state
    if (isMinimized || isPinned) {
      return (
        <div className="flex items-center justify-start gap-2 px-3 py-2 h-full w-full">
          <Icon className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium truncate">{title}</span>
        </div>
      );
    }
    // Content for normal or maximized state
    return (
      <CardContent className="flex-grow p-0 overflow-hidden">
        <Content />
      </CardContent>
    );
  };

  const isVisuallyMinimized = isMinimized || isPinned;
  const isResizable = !isMaximized && !isVisuallyMinimized;
  const isDraggable = !isMaximized && !isPinned; // Draggable if not maximized or pinned (includes minimized)

  return (
    <Card
      ref={cardRef}
      className={cn(
        "absolute bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
        // Sizing based on state
        isMaximized ? "inset-0 w-full h-full" : "",
        isMinimized ? "w-56 h-12" : `w-[${size.width}px] h-[${size.height}px]`,
        isPinned ? "w-[192px] h-[48px]" : "", // Pinned fixed size
        
        // Cursor and resize behavior
        isResizable ? "resize overflow-auto" : "", // Only apply resize if resizable
        isDraggable ? "cursor-grab" : "", // Apply grab cursor if draggable
        isMinimized ? "cursor-pointer" : "", // Minimized is clickable to restore
        "z-50",
        "pointer-events-auto"
      )}
      style={{
        left: isMaximized || isPinned ? undefined : position.x,
        top: isMaximized || isPinned ? undefined : position.y,
        width: isMaximized || isPinned ? undefined : size.width,
        height: isMaximized || isPinned ? undefined : size.height,
        zIndex: zIndex,
        ...dragStyle
      }}
      onClick={isMinimized ? () => onMinimize(id) : undefined} // Only expand floating minimized on click
      onMouseDown={onBringToFront}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          isVisuallyMinimized ? "hidden" : "flex" // Hide header only for floating minimized and pinned
        )}
        {...(isDraggable && { ...listeners, ...attributes })} // Apply drag listeners if draggable
      >
        <CardTitle className="text-lg font-medium leading-none">
          {title}
        </CardTitle>
        <div className="flex gap-1">
          {!isPinned && ( // Only show minimize/maximize/restore if not pinned
            <>
              {isMinimized ? (
                <Button variant="ghost" size="icon" onClick={() => onMinimize(id)} title="Restore">
                  <Maximize className="h-4 w-4" />
                </Button>
              ) : isMaximized ? (
                <Button variant="ghost" size="icon" onClick={() => onMaximize(id)} title="Restore">
                  <Minimize className="h-4 w-4" />
                </Button>
              ) : (
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

      {/* Render content based on state */}
      {isVisuallyMinimized ? (
        renderCardContent()
      ) : (
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
            isMaximized || isPinned ? "w-full h-full" : ""
          )}
          handle={null} // Always hide react-resizable's own handles
        >
          {renderCardContent()}
        </ResizableBox>
      )}
    </Card>
  );
}