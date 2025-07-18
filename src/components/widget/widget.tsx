"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize, Pin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from "@/components/resizable-box";
import type { ResizeCallbackData } from 'react-resizable';
import { DOCKED_WIDGET_WIDTH, DOCKED_WIDGET_HEIGHT, MINIMIZED_WIDGET_WIDTH, MINIMIZED_WIDGET_HEIGHT } from "@/hooks/widgets/types"; // Import constants
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
  isMobile: boolean; // New prop
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
  const widgetRef = useRef<HTMLDivElement>(null); // Ref to the widget's main div

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `widget-${id}`,
    data: { id, type: "widget", initialPosition: position },
    disabled: isPinned || isMaximized || isInsideDock || isClosed,
  });

  // Effect to "transfer" dnd-kit's transform to left/top when dragging starts
  useEffect(() => {
    if (isDragging && widgetRef.current) {
      const style = window.getComputedStyle(widgetRef.current);
      const matrix = new DOMMatrixReadOnly(style.transform);
      
      // Update the widget's position state to reflect the current transformed position
      // This ensures the CSS `left`/`top` values are aligned with the visual position
      // before dnd-kit's transform is cleared.
      onSizeChange({ width: size.width, height: size.height }); // Trigger a state update to re-render with new position
      
      // Apply the transform's translation to the element's style directly
      // and then clear the transform property.
      widgetRef.current.style.left = `${position.x + matrix.e}px`;
      widgetRef.current.style.top = `${position.y + matrix.f}px`;
      widgetRef.current.style.transform = 'none';
    }
  }, [isDragging, position.x, position.y, size.width, size.height, onSizeChange]);


  const isVisuallyMinimized = isMinimized || isPinned;
  const isResizable = !isMaximized && !isVisuallyMinimized && !isInsideDock && !isClosed && !isMobile;
  const isDraggable = !isMaximized && !isPinned && !isInsideDock && !isClosed;

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

  actualWidth = Math.max(actualWidth, 100);
  actualHeight = Math.max(actualHeight, 80);

  const renderWidgetContent = (
    <Card className={cn(
      "w-full h-full flex flex-col overflow-hidden",
      isInsideDock ? "bg-transparent border-none shadow-none" : "bg-transparent"
    )}>
      {!isInsideDock && (
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

      {!isVisuallyMinimized && !isInsideDock && (
        <CardContent className="flex-grow p-0 overflow-y-auto">
          <Content isCurrentRoomWritable={isCurrentRoomWritable} isMobile={isMobile} />
        </CardContent>
      )}
    </Card>
  );

  if (isInsideDock) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-full flex flex-col",
          "transition-all duration-300 ease-in-out",
          "w-10 h-10",
          "pointer-events-auto",
          "cursor-pointer"
        )}
        onClick={() => onPin(id)}
        onMouseDown={onBringToFront}
      >
        <div className="flex items-center justify-center flex-1 min-w-0 h-full">
          <Icon className="h-5 w-5 text-primary" />
          <span className="sr-only">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (widgetRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={{
        left: position.x,
        top: position.y,
        zIndex: zIndex,
        width: actualWidth,
        height: actualHeight,
        position: 'absolute',
        // Apply dnd-kit's transform only when dragging
        transform: isDragging && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : 'none',
      }}
      className={cn(
        "bg-card/40 border-white/20 shadow-lg rounded-lg flex flex-col",
        "transition-[left,top,width,height] duration-300 ease-in-out",
        isTopmost ? "backdrop-blur-2xl" : "backdrop-blur-xl",
        isResizable ? "resize" : "",
        isMinimized && !isPinned ? "cursor-pointer" : "",
        "pointer-events-auto",
        isClosed && "hidden"
      )}
      onMouseDown={onBringToFront}
    >
      <ResizableBox
        width={actualWidth}
        height={actualHeight}
        onResizeStop={(e: React.SyntheticEvent, data: ResizeCallbackData) => {
          if (isResizable) {
            onSizeChange({ width: data.size.width, height: data.size.height });
          }
        }}
        minConstraints={[100, 80]}
        maxConstraints={[mainContentArea.width, mainContentArea.height]}
        className="w-full h-full"
        resizeHandles={isResizable ? ['s', 'e', 'w', 'se', 'sw'] : []}
      >
        {renderWidgetContent}
      </ResizableBox>
    </div>
  );
}