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
  isTopmost: boolean; // New prop
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  // onPositionChange: (newPosition: { x: number; y: number }) => void; // Removed this prop
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
  isTopmost, // Destructure new prop
  position,
  size,
  zIndex,
  // onPositionChange, // This will be handled by onDragEnd in parent
  onSizeChange,
  onBringToFront,
  onMinimize,
  onMaximize,
  onPin,
  onClose,
}: WidgetProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `widget-${id}`,
    data: { id, type: "widget", initialPosition: position }, // Pass initial position for onDragEnd
    disabled: isPinned || isMaximized,
  });

  // Apply transform only for active dragging, otherwise use the stored position
  // The transform object contains the delta from the start of the drag.
  // The actual position update will happen in the parent's onDragEnd.
  const currentTransformStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : {};

  const isVisuallyMinimized = isMinimized || isPinned;
  const isResizable = !isMaximized && !isVisuallyMinimized;
  const isDraggable = !isMaximized && !isPinned; // Draggable if not maximized or pinned (includes minimized)

  // Helper function to render the widget's main content area
  const renderWidgetContent = () => {
    return (
      <CardContent className="flex-grow p-0 overflow-hidden">
        <Content />
      </CardContent>
    );
  };

  return (
    <Card
      ref={setNodeRef} // Set node ref for draggable
      className={cn(
        "absolute bg-card border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden", // Removed /40
        "transition-all duration-300 ease-in-out",
        isTopmost ? "backdrop-blur-2xl" : "backdrop-blur-xl", // Dynamic blur based on isTopmost
        // Sizing based on state
        isMaximized ? "inset-0 w-full h-full" : "",
        isPinned ? "w-[192px] h-[48px]" : "", // Pinned fixed size
        isMinimized && !isPinned ? "w-56 h-12" : "", // Floating minimized fixed size
        
        // Cursor and resize behavior
        isResizable ? "resize" : "",
        isMinimized && !isPinned ? "cursor-pointer" : "", // Minimized is clickable to restore
        "pointer-events-auto"
      )}
      style={{
        left: isMaximized ? undefined : position.x, // Apply position.x if not maximized
        top: isMaximized ? undefined : position.y, // Apply position.y if not maximized
        width: (!isMaximized && !isPinned && !isMinimized) ? size.width : undefined, // Only apply if normal floating
        height: (!isMaximized && !isPinned && !isMinimized) ? size.height : undefined, // Only apply if normal floating
        zIndex: zIndex, // Use the zIndex from props
        ...currentTransformStyle // Apply transform for dragging
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
      >
        {isVisuallyMinimized ? (
          // Content for minimized/pinned header
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
            "flex-grow flex flex-col overflow-hidden", // This should be overflow-hidden to prevent ResizableBox from having its own scrollbar
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