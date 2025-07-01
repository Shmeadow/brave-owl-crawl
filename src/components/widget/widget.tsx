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
    if (transform && cardRef.current && !isPinned && !isMaximized) {
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
        isPinned ? "w-[192px] h-[48px]" : "", // Pinned fixed size
        isMinimized && !isPinned ? "w-56 h-12" : "", // Floating minimized fixed size
        
        // Cursor and resize behavior
        isResizable ? "resize overflow-auto" : "", // Only apply resize if resizable
        isDraggable ? "cursor-grab" : "", // Apply grab cursor if draggable
        isMinimized && !isPinned ? "cursor-pointer" : "", // Minimized is clickable to restore
        "z-50",
        "pointer-events-auto"
      )}
      style={{
        left: isMaximized || isPinned ? undefined : position.x,
        top: isMaximized || isPinned ? undefined : position.y,
        width: (!isMaximized && !isPinned && !isMinimized) ? size.width : undefined, // Only apply if normal floating
        height: (!isMaximized && !isPinned && !isMinimized) ? size.height : undefined, // Only apply if normal floating
        zIndex: zIndex,
        ...dragStyle
      }}
      onClick={isMinimized && !isPinned ? () => onMinimize(id) : undefined} // Only expand floating minimized on click
      onMouseDown={onBringToFront}
    >
      {/* Always render CardHeader, but its content changes */}
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isVisuallyMinimized ? "p-2 h-12" : "pb-2" // Smaller padding/height for minimized/pinned header
        )}
        {...(isDraggable && { ...listeners, ...attributes })}
      >
        {isVisuallyMinimized ? (
          // Content for minimized/pinned header
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Icon className="h-6 w-6 text-primary" />
              <CardTitle className="text-sm font-medium leading-none truncate">{title}</CardTitle>
            </div>
            <div className="flex gap-1">
              {isPinned ? (
                // Pinned controls
                <>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMaximize(id); }} title="Maximize">
                    <Maximize className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPin(id); }} title="Unpin">
                    <PinOff className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                // Floating minimized controls
                <>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMaximize(id); }} title="Maximize">
                    <Maximize className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPin(id); }} title="Pin">
                    <Pin className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onClose(id); }} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          // Content for normal/maximized header
          <>
            <CardTitle className="text-lg font-medium leading-none">
              {title}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onMinimize(id)} title="Minimize">
                <Minimize className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onMaximize(id)} title="Maximize">
                <Maximize className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onPin(id)} title="Pin">
                <Pin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onClose(id)} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardHeader>

      {/* Render content only if not visually minimized */}
      {!isVisuallyMinimized && (
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
            isMaximized ? "w-full h-full" : "" // ResizableBox takes full size if maximized
          )}
          handle={null}
        >
          {renderCardContent()}
        </ResizableBox>
      )}
    </Card>
  );
}