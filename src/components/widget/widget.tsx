"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize, Pin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from "@/components/resizable-box";
import type { ResizeCallbackData } from 'react-resizable';
import { DOCKED_WIDGET_WIDTH, DOCKED_WIDGET_HEIGHT } from "@/hooks/widgets/types"; // Import constants
import { WidgetHeader } from './widget-header';

interface WidgetProps {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ElementType;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  isClosed: boolean; // New prop
  isTopmost: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onSizeChange: (newSize: { width: number; height: number }) => void;
  onBringToFront: () => void;
  onMaximize: (id: string) => void;
  onPin: (id: string) => void;
  onClose: (id: string) => void;
  isCurrentRoomWritable: boolean;
  mainContentArea: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  isMobile: boolean;
  isInsideDock?: boolean; // New prop
}

export function Widget({
  id,
  title,
  icon: Icon,
  content: Content,
  isMinimized,
  isMaximized,
  isPinned,
  isClosed, // Use this prop for visibility
  isTopmost,
  position,
  size, // This size will be passed to ResizableBox
  zIndex,
  onSizeChange,
  onBringToFront,
  onMaximize,
  onPin,
  onClose,
  isCurrentRoomWritable,
  mainContentArea,
  isMobile,
  isInsideDock = false, // Default to false
}: WidgetProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ // Destructure isDragging
    id: `widget-${id}`,
    data: { id, type: "widget", initialPosition: position },
    disabled: isPinned || isMaximized || isMobile || isInsideDock || isClosed, // Disable dragging if closed
  });

  const currentTransformStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : {};

  const isVisuallyMinimized = isMinimized || isPinned;
  const isResizable = !isMaximized && !isVisuallyMinimized && !isMobile && !isInsideDock && !isClosed; // Disable resizing if closed
  const isDraggable = !isMaximized && !isPinned && !isMobile && !isInsideDock && !isClosed; // Disable dragging if closed

  // Determine actual width/height for ResizableBox based on state
  let actualWidth = size.width;
  let actualHeight = size.height;

  if (isMaximized) {
    actualWidth = mainContentArea.width;
    actualHeight = mainContentArea.height;
  } else if (isPinned || isMinimized) { // Apply compact size for both pinned and minimized
    actualWidth = DOCKED_WIDGET_WIDTH;
    actualHeight = DOCKED_WIDGET_HEIGHT;
  }

  // Ensure minimum dimensions for ResizableBox, matching minConstraints
  actualWidth = Math.max(actualWidth, 200); 
  actualHeight = Math.max(actualHeight, 150);

  const renderWidgetContent = (
    <Card className={cn(
      "w-full h-full flex flex-col overflow-hidden",
      isInsideDock ? "bg-transparent border-none shadow-none" : "bg-transparent" // No background/border/shadow if inside dock
    )}>
      {!isInsideDock && ( // Only render header if not inside dock
        <WidgetHeader
          title={title}
          icon={Icon}
          onMaximize={() => onMaximize(id)}
          onClose={() => onClose(id)}
          onTogglePin={() => onPin(id)}
          isMaximized={isMaximized}
          isPinned={isPinned}
          isDraggable={isDraggable}
          isResizable={isResizable}
          isInsideDock={isInsideDock}
          isCurrentRoomWritable={isCurrentRoomWritable}
          listeners={isDraggable ? listeners : undefined}
          attributes={isDraggable ? attributes : undefined}
        />
      )}

      {!isVisuallyMinimized && !isInsideDock && ( // Only render content if not minimized and not inside dock
        <CardContent className="flex-grow p-0 overflow-y-auto">
          <Content isCurrentRoomWritable={isCurrentRoomWritable} />
        </CardContent>
      )}
    </Card>
  );

  // Render logic for the widget wrapper
  if (isInsideDock) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-full flex flex-col",
          "transition-all duration-300 ease-in-out",
          "w-12 h-12", // Fixed size for the button in the dock
          "pointer-events-auto",
          "cursor-pointer" // Indicate clickable to unpin
        )}
        onClick={() => onPin(id)} // Clicking a docked widget unpins it
        onMouseDown={onBringToFront}
      >
        <div className="flex items-center justify-center flex-1 min-w-0 h-full">
          <Icon className="h-6 w-6 text-primary" />
          <span className="sr-only">{title}</span>
        </div>
      </div>
    );
  }

  // For floating widgets (normal, minimized, maximized, or closed)
  return (
    <div
      ref={setNodeRef} // Apply draggable ref here to the outer div
      style={isMobile ? {} : { // No fixed positioning on mobile, let flexbox handle it
        left: position.x,
        top: position.y,
        zIndex: zIndex,
        ...currentTransformStyle,
        width: actualWidth, // Explicitly set width/height on the outer div
        height: actualHeight,
        position: 'absolute', // Ensure positioning
      }}
      className={cn(
        "bg-card/40 border-white/20 shadow-lg rounded-lg flex flex-col",
        "transition-all duration-300 ease-in-out",
        isDragging && "transition-none", // Disable transitions during drag
        isTopmost ? "backdrop-blur-2xl" : "backdrop-blur-xl",
        isResizable ? "resize" : "",
        isMinimized && !isPinned ? "cursor-pointer" : "",
        isMobile ? "relative w-full h-auto pointer-events-auto" : "pointer-events-auto", // Mobile styling: relative, full width, auto height, margin
        isClosed && "hidden" // Hide if closed
      )}
      onMouseDown={onBringToFront}
    >
      {isMobile ? (
        renderWidgetContent
      ) : (
        <ResizableBox
          width={actualWidth}
          height={actualHeight}
          onResizeStop={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
            if (isResizable) {
              onSizeChange({ width: data.size.width, height: data.size.height });
            }
          }}
          minConstraints={[200, 150]}
          maxConstraints={[mainContentArea.width, mainContentArea.height]}
          className="w-full h-full"
          resizeHandles={isResizable ? ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] : []}
        >
          {renderWidgetContent}
        </ResizableBox>
      )}
    </div>
  );
}