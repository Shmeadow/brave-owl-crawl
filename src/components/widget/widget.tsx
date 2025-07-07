"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize, Maximize, Pin, PinOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from "@/components/resizable-box";
import type { ResizeCallbackData } from 'react-resizable';
import { DOCKED_WIDGET_WIDTH, DOCKED_WIDGET_HEIGHT, MINIMIZED_WIDGET_WIDTH, MINIMIZED_WIDGET_HEIGHT } from "@/hooks/widgets/types"; // Import constants

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
  onMinimize: (id: string) => void;
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
  onMinimize,
  onMaximize,
  onPin,
  onClose,
  isCurrentRoomWritable,
  mainContentArea,
  isMobile,
  isInsideDock = false, // Default to false
}: WidgetProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
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
  } else if (isPinned) {
    actualWidth = DOCKED_WIDGET_WIDTH;
    actualHeight = DOCKED_WIDGET_HEIGHT;
  } else if (isMinimized) {
    actualWidth = MINIMIZED_WIDGET_WIDTH;
    actualHeight = MINIMIZED_WIDGET_HEIGHT;
  }

  // Ensure minimum dimensions for ResizableBox, matching minConstraints
  actualWidth = Math.max(actualWidth, 200); 
  actualHeight = Math.max(actualHeight, 150);

  const renderWidgetContent = (
    <Card className={cn(
      "w-full h-full flex flex-col overflow-hidden",
      isInsideDock ? "bg-transparent border-none shadow-none" : "bg-transparent" // No background/border/shadow if inside dock
    )}>
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isVisuallyMinimized ? "p-2 h-12" : "pb-2",
          isInsideDock ? "p-0 h-auto" : "" // Minimal padding if inside dock
        )}
      >
        {isInsideDock ? ( // Simplified header for docked widgets (icon only, unpin on click)
          <>
            <div 
              className={cn("flex items-center justify-center flex-1 min-w-0 h-full")} // Centered icon
            >
              <Icon className="h-8 w-8 text-primary" /> {/* Changed from h-6 w-6 to h-8 w-8 */}
              <span className="sr-only">{title}</span> {/* Screen reader only title */}
            </div>
            {/* Removed X button from pinned widgets */}
          </>
        ) : ( // Full header for normal/maximized/minimized floating widgets
          <>
            <div 
              className={cn("flex-1 min-w-0", isDraggable && "cursor-grab")}
              {...(isDraggable && { ...listeners, ...attributes })}
            >
              <CardTitle className={cn(
                "font-medium leading-none",
                isVisuallyMinimized ? "text-sm" : "text-lg"
              )}>
                {title}
              </CardTitle>
            </div>
            <div className="flex gap-1">
              {!isMobile && ( // Hide minimize/maximize/pin on mobile
                <>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMinimize(id); }} title="Minimize">
                    <Minimize className="h-4 w-4" />
                  </Button>
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
        )}
      </CardHeader>

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
        {renderWidgetContent}
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
        "bg-background/40 border-white/20 shadow-lg rounded-lg flex flex-col",
        "transition-all duration-300 ease-in-out",
        isTopmost ? "backdrop-blur-2xl" : "backdrop-blur-xl",
        isResizable ? "resize" : "",
        isMinimized && !isPinned ? "cursor-pointer" : "",
        isMobile ? "relative w-full h-auto pointer-events-auto" : "pointer-events-auto", // Mobile styling: relative, full width, auto height, margin
        isClosed && "hidden" // Hide if closed
      )}
      onClick={isMinimized && !isPinned ? () => onMinimize(id) : undefined}
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
          resizeHandles={isResizable ? ["se"] : []}
        >
          {renderWidgetContent}
        </ResizableBox>
      )}
    </div>
  );
}