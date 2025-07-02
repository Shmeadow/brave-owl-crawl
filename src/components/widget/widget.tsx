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
  isTopmost: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onSizeChange: (newSize: { width: number; height: number }) => void;
  onBringToFront: () => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onPin: (id: string) => void;
  onClose: (id: string) => void;
  isCurrentRoomWritable: boolean;
  mainContentArea: { // Add this prop
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

// Constants for widget dimensions (should match WidgetProvider)
const DOCKED_WIDGET_WIDTH = 192;
const DOCKED_WIDGET_HEIGHT = 48;
const MINIMIZED_WIDGET_WIDTH = 224; // Assuming this from PomodoroWidget
const MINIMIZED_WIDGET_HEIGHT = 48;

export function Widget({
  id,
  title,
  icon: Icon,
  content: Content,
  isMinimized,
  isMaximized,
  isPinned,
  isTopmost,
  position,
  size, // This size will be passed to ResizableBox
  zIndex,
  onSizeChange,
  onBringToFront,
  onMinimize,
  onMaximize,
  onPin,
  onClose,
  isCurrentRoomWritable,
  mainContentArea, // Destructure new prop
}: WidgetProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `widget-${id}`,
    data: { id, type: "widget", initialPosition: position },
    disabled: isPinned || isMaximized,
  });

  const currentTransformStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : {};

  const isVisuallyMinimized = isMinimized || isPinned;
  const isResizable = !isMaximized && !isVisuallyMinimized;
  const isDraggable = !isMaximized && !isPinned;

  // Determine actual width/height for ResizableBox based on state
  let actualWidth = size.width;
  let actualHeight = size.height;

  if (isMaximized) {
    actualWidth = mainContentArea.width;
    actualHeight = mainContentArea.height;
  } else if (isPinned) {
    actualWidth = DOCKED_WIDGET_WIDTH;
    actualHeight = DOCKED_WIDGET_HEIGHT;
  } else if (isMinimized) {
    actualWidth = MINIMIZED_WIDGET_WIDTH;
    actualHeight = MINIMIZED_WIDGET_HEIGHT;
  }

  return (
    <ResizableBox
      ref={setNodeRef} // Apply draggable ref to ResizableBox
      width={actualWidth} // Pass calculated width
      height={actualHeight} // Pass calculated height
      onResizeStop={(e, direction, ref, d) => {
        if (isResizable && ref) { // Add ref check
          // Use ref.offsetWidth and ref.offsetHeight to get the actual new size
          onSizeChange({ width: ref.offsetWidth, height: ref.offsetHeight });
        }
      }}
      minConstraints={[200, 150]}
      maxConstraints={[mainContentArea.width, mainContentArea.height]} // Use mainContentArea for maxConstraints
      className={cn(
        "absolute bg-card border-white/20 shadow-lg rounded-lg flex flex-col",
        "transition-all duration-300 ease-in-out",
        isTopmost ? "backdrop-blur-2xl" : "backdrop-blur-xl",
        isResizable ? "resize" : "",
        isMinimized && !isPinned ? "cursor-pointer" : "",
        "pointer-events-auto"
      )}
      style={{
        left: position.x,
        top: position.y,
        zIndex: zIndex,
        ...currentTransformStyle
      }}
      handles={isResizable ? ["se"] : []} // Only show SE handle if resizable
      onClick={isMinimized && !isPinned ? () => onMinimize(id) : undefined}
      onMouseDown={onBringToFront}
    >
      <Card className="w-full h-full flex flex-col overflow-hidden"> {/* Card fills ResizableBox */}
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between space-y-0",
            isVisuallyMinimized ? "p-2 h-12" : "pb-2"
          )}
        >
          {isVisuallyMinimized ? (
            <>
              <div 
                className={cn("flex items-center gap-2 flex-1 min-w-0", isDraggable && "cursor-grab")}
                {...(isDraggable && { ...listeners, ...attributes })}
              >
                <Icon className="h-6 w-6 text-primary" />
                <CardTitle className="text-sm font-medium leading-none truncate">{title}</CardTitle>
              </div>
              <div className="flex gap-1">
                {isPinned ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMaximize(id); }} title="Maximize">
                      <Maximize className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPin(id); }} title="Unpin">
                      <PinOff className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
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
            <>
              <div 
                className={cn("flex-1 min-w-0", isDraggable && "cursor-grab")}
                {...(isDraggable && { ...listeners, ...attributes })}
              >
                <CardTitle className="text-lg font-medium leading-none">
                  {title}
                </CardTitle>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMinimize(id); }} title="Minimize">
                  <Minimize className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMaximize(id); }} title="Maximize">
                  <Maximize className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPin(id); }} title="Pin">
                  <Pin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onClose(id); }} title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardHeader>

        {!isVisuallyMinimized && (
          <CardContent className="flex-grow p-0 overflow-y-auto">
            <Content isCurrentRoomWritable={isCurrentRoomWritable} />
          </CardContent>
        )}
      </Card>
    </ResizableBox>
  );
}