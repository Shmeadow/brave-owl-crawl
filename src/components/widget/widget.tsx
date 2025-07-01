"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize, Maximize, Pin, PinOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from "@/components/ui/resizable-box";
import { WidgetId } from "@/hooks/use-widget-state";

interface WidgetProps {
  id: WidgetId;
  title: string;
  icon: React.ElementType;
  content: React.ElementType;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  isOpen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onMinimize: (id: WidgetId) => void;
  onMaximize: (id: WidgetId) => void;
  onPin: (id: WidgetId) => void;
  onClose: (id: WidgetId) => void;
  onDragEnd: (id: WidgetId, position: { x: number; y: number }) => void;
  onResizeEnd: (id: WidgetId, size: { width: number; height: number }) => void;
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
  onMinimize,
  onMaximize,
  onPin,
  onClose,
  onDragEnd,
  onResizeEnd,
}: WidgetProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `widget-${id}`,
    data: { id, type: "widget" },
  });

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transform && cardRef.current && !isPinned && !isMaximized && !isMinimized) {
      const newX = position.x + transform.x;
      const newY = position.y + transform.y;
      onDragEnd(id, { x: newX, y: newY });
    }
  }, [transform, id, onDragEnd, position, isPinned, isMaximized, isMinimized]);

  const draggableProps = {
    ref: setNodeRef,
    style: transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined,
    ...listeners,
    ...attributes,
  };

  if (!isOpen && !isPinned) {
    return null;
  }

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
        isPinned ? "relative !w-auto !h-auto" : "",
        isPinned && !isMinimized && !isMaximized ? "flex-grow" : "",
        !isPinned && !isMaximized && !isMinimized ? "resize overflow-auto" : "",
        !isPinned && !isMaximized && !isMinimized ? "cursor-grab" : "",
        isPinned ? "cursor-default" : "",
        isMinimized ? "cursor-pointer" : "",
        "z-50"
      )}
      style={!isMaximized && !isPinned ? { left: position.x, top: position.y } : {}}
      onClick={isMinimized ? () => onMinimize(id) : undefined}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0 pb-2",
          isMinimized ? "hidden" : "flex"
        )}
        {...(!isPinned && !isMaximized && !isMinimized && { ...draggableProps })}
      >
        <CardTitle className="text-lg font-medium leading-none">
          {title}
        </CardTitle>
        <div className="flex gap-1">
          {!isPinned && ( // Only show minimize/maximize if not pinned
            <Button variant="ghost" size="icon" onClick={() => onMinimize(id)} title={isMinimized ? "Maximize" : "Minimize"}>
              {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
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
            if (!isMaximized && !isPinned) {
              onResizeEnd(id, { width: size.width + d.width, height: size.height + d.height });
            }
          }}
          minConstraints={[200, 150]}
          maxConstraints={[window.innerWidth, window.innerHeight]}
          className={cn(
            "flex-grow flex flex-col",
            isMaximized || isPinned ? "w-full h-full" : ""
          )}
          handle={!isMaximized && !isPinned ? undefined : {}} // Disable handles when maximized or pinned
        >
          {renderCardContent()}
        </ResizableBox>
      )}
    </Card>
  );
}