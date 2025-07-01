"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize2, Maximize2, X, Pin, PinOff } from "lucide-react"; // Import Pin and PinOff
import { cn } from "@/lib/utils";
import { useWidget } from "./widget-context";
import { AnimatePresence, motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from 'react-resizable';
import { CSS } from "@dnd-kit/utilities";

interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialWidth?: number;
  initialHeight?: number;
}

// Constants for docked widget size and position
const MINIMIZED_WIDTH = 200;
const MINIMIZED_HEIGHT = 50;
const DOCKED_WIDTH = 180;
const DOCKED_HEIGHT = 60;
const DOCKED_OFFSET_RIGHT = 20;
const DOCKED_OFFSET_BOTTOM = 20; // Adjust as needed to avoid chat overlap

export function Widget({
  id,
  title,
  children,
  initialPosition,
  initialWidth,
  initialHeight,
}: WidgetProps) {
  const { widgetStates, minimizeWidget, restoreWidget, closeWidget, updateWidgetPosition, updateWidgetSize, toggleDocked } = useWidget();
  const state = widgetStates[id] || { isOpen: false, isMinimized: false, isDocked: false, x: initialPosition?.x || 50, y: initialPosition?.y || 50, width: initialWidth || 400, height: initialHeight || 500, previousX: initialPosition?.x || 50, previousY: initialPosition?.y || 50, previousWidth: initialWidth || 400, previousHeight: initialHeight || 500 };

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${id}`, // Unique ID for draggable
    disabled: state.isMinimized || state.isDocked, // Disable dragging when minimized or docked
  });

  const handleResize = (event: any, { size }: { size: { width: number; height: number } }) => {
    updateWidgetSize(id, size.width, size.height);
  };

  if (!state.isOpen) {
    console.log(`Widget ${id} is not open, returning null.`);
    return null; // Don't render if not open
  }

  console.log(`Rendering Widget ${id}. State:`, state);

  // Calculate dynamic position and size based on state
  const currentX = state.isDocked ? (window.innerWidth - DOCKED_WIDTH - DOCKED_OFFSET_RIGHT) : state.x;
  const currentY = state.isDocked ? (window.innerHeight - DOCKED_HEIGHT - DOCKED_OFFSET_BOTTOM) : state.y;
  const currentWidth = state.isMinimized || state.isDocked ? MINIMIZED_WIDTH : state.width;
  const currentHeight = state.isMinimized || state.isDocked ? MINIMIZED_HEIGHT : state.height;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed",
          state.isDocked ? "z-45" : "z-40", // Slightly higher z-index for docked widgets
          "bg-card/80 backdrop-blur-md border border-border rounded-lg shadow-xl",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-in-out",
          state.isDocked && "ring-2 ring-gold" // Golden border for docked
        )}
        style={{
          left: `${currentX}px`,
          top: `${currentY}px`,
          width: currentWidth,
          height: currentHeight,
          transform: CSS.Transform.toString(transform), // Apply drag offset
        }}
      >
        <ResizableBox
          width={currentWidth}
          height={currentHeight}
          minConstraints={[200, 150]} // Minimum width/height
          maxConstraints={[window.innerWidth - currentX, window.innerHeight - currentY]} // Maximize to viewport
          onResize={handleResize}
          handle={(handleAxis, ref) => (
            <span
              className={`react-resizable-handle react-resizable-handle-${handleAxis}`}
              ref={ref}
              style={{
                position: 'absolute',
                background: 'transparent',
                zIndex: 1,
                // Only show handles when not minimized or docked
                display: (state.isMinimized || state.isDocked) ? 'none' : 'block',
              }}
            />
          )}
          // Disable resizing when minimized or docked
          resizeHandles={(state.isMinimized || state.isDocked) ? [] : ['sw', 'se', 'nw', 'ne', 'w', 'e', 'n', 's']}
          className={cn(
            "flex flex-col h-full w-full",
            state.isMinimized || state.isDocked ? "h-auto w-auto" : ""
          )}
        >
          <CardHeader
            ref={setNodeRef} // Set ref for draggable handle
            className={cn(
              "flex flex-row items-center justify-between p-3 border-b border-border",
              state.isMinimized ? "cursor-pointer" : (state.isDocked ? "cursor-default" : "cursor-grab") // Change cursor based on docked state
            )}
            onClick={state.isMinimized ? () => restoreWidget(id) : undefined}
            {...listeners} // Apply listeners to the header for dragging
            {...attributes} // Apply attributes for draggable
          >
            <CardTitle className="text-lg font-semibold flex-1 text-foreground">
              {title}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => toggleDocked(id)} title={state.isDocked ? "Undock" : "Dock"}>
                {state.isDocked ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                <span className="sr-only">{state.isDocked ? "Undock" : "Dock"}</span>
              </Button>
              {state.isMinimized ? (
                <Button variant="ghost" size="icon" onClick={() => restoreWidget(id)} title="Restore">
                  <Maximize2 className="h-4 w-4" />
                  <span className="sr-only">Restore</span>
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => minimizeWidget(id)} title="Minimize">
                  <Minimize2 className="h-4 w-4" />
                  <span className="sr-only">Minimize</span>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => { console.log(`Close button clicked for widget ${id}`); closeWidget(id); }} title="Close">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </CardHeader>
          {!(state.isMinimized || state.isDocked) && ( // Show full content if not minimized AND not docked
            <CardContent className="flex-1 p-4 overflow-y-auto">
              {children}
            </CardContent>
          )}
          {(state.isMinimized || state.isDocked) && ( // Show minimized content if minimized OR docked
            <CardContent className="flex-1 p-2 flex items-center justify-center">
              <span className="text-sm text-foreground truncate">{title}</span>
            </CardContent>
          )}
        </ResizableBox>
      </motion.div>
    </AnimatePresence>
  );
}