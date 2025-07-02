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
}

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
  size,
  zIndex,
  onSizeChange,
  onBringToFront,
  onMinimize,
  onMaximize,
  onPin,
  onClose,
  isCurrentRoomWritable,
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

  const renderWidgetContent = () => {
    return (
      <CardContent className="flex-grow p-0 overflow-hidden">
        <Content isCurrentRoomWritable={isCurrentRoomWritable} />
      </CardContent>
    );
  };

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "absolute bg-card border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
        isTopmost ? "backdrop-blur-2xl" : "backdrop-blur-xl",
        isMaximized ? "inset-0 w-full h-full" : "",
        isPinned ? "w-[192px] h-[48px]" : "",
        isMinimized && !isPinned ? "w-56 h-12" : "",
        
        isResizable ? "resize" : "",
        isMinimized && !isPinned ? "cursor-pointer" : "",
        "pointer-events-auto"
      )}
      style={{
        left: isMaximized ? undefined : position.x,
        top: isMaximized ? undefined : position.y,
        width: (!isMaximized && !isPinned && !isMinimized) ? size.width : undefined,
        height: (!isMaximized && !isPinned && !isMinimized) ? size.height : undefined,
        zIndex: zIndex,
        ...currentTransformStyle
      }}
      onClick={isMinimized && !isPinned ? () => onMinimize(id) : undefined}
      onMouseDown={onBringToFront}
    >
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
            "flex-grow flex flex-col overflow-hidden",
            isMaximized ? "w-full h-full" : ""
          )}
          handle={null}
        >
          {renderWidgetContent()}
        </ResizableBox>
      )}
    </Card>
  );
}