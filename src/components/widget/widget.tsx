"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize2, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidget } from "./widget-context";
import { AnimatePresence, motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { ResizableBox } from 'react-resizable'; // Import ResizableBox
import { CSS } from "@dnd-kit/utilities"; // Import CSS utility

interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialWidth?: number;
  initialHeight?: number;
}

export function Widget({
  id,
  title,
  children,
  initialPosition,
  initialWidth,
  initialHeight,
}: WidgetProps) {
  const { widgetStates, minimizeWidget, restoreWidget, closeWidget, updateWidgetPosition, updateWidgetSize } = useWidget();
  const state = widgetStates[id] || { isOpen: false, isMinimized: false, x: initialPosition?.x || 50, y: initialPosition?.y || 50, width: initialWidth || 400, height: initialHeight || 500, previousX: initialPosition?.x || 50, previousY: initialPosition?.y || 50, previousWidth: initialWidth || 400, previousHeight: initialHeight || 500 };

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${id}`, // Unique ID for draggable
    disabled: state.isMinimized, // Disable dragging when minimized
  });

  const handleResize = (event: any, { size }: { size: { width: number; height: number } }) => {
    updateWidgetSize(id, size.width, size.height);
  };

  if (!state.isOpen) {
    return null; // Don't render if not open
  }

  const MINIMIZED_WIDTH = 200;
  const MINIMIZED_HEIGHT = 50;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed z-40", // Lower z-index than chat (z-50)
          "bg-card/80 backdrop-blur-md border border-border rounded-lg shadow-xl",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-in-out"
        )}
        style={{
          left: `${state.x}px`, // Base position
          top: `${state.y}px`, // Base position
          transform: CSS.Transform.toString(transform), // Apply drag offset
          width: state.isMinimized ? MINIMIZED_WIDTH : state.width,
          height: state.isMinimized ? MINIMIZED_HEIGHT : state.height,
        }}
      >
        <ResizableBox
          width={state.isMinimized ? MINIMIZED_WIDTH : state.width}
          height={state.isMinimized ? MINIMIZED_HEIGHT : state.height}
          minConstraints={[200, 150]} // Minimum width/height
          maxConstraints={[window.innerWidth - state.x, window.innerHeight - state.y]} // Maximize to viewport
          onResize={handleResize}
          handle={(handleAxis, ref) => (
            <span
              className={`react-resizable-handle react-resizable-handle-${handleAxis}`}
              ref={ref}
              style={{
                position: 'absolute',
                background: 'transparent',
                zIndex: 1,
                // Only show handles when not minimized
                display: state.isMinimized ? 'none' : 'block',
              }}
            />
          )}
          // Disable resizing when minimized
          resizeHandles={state.isMinimized ? [] : ['sw', 'se', 'nw', 'ne', 'w', 'e', 'n', 's']}
          className={cn(
            "flex flex-col h-full w-full",
            state.isMinimized ? "h-auto w-auto" : ""
          )}
        >
          <CardHeader
            ref={setNodeRef} // Set ref for draggable handle
            className={cn(
              "flex flex-row items-center justify-between p-3 border-b border-border",
              state.isMinimized ? "cursor-pointer" : "cursor-grab"
            )}
            onClick={state.isMinimized ? () => restoreWidget(id) : undefined}
            {...listeners} // Apply listeners to the header for dragging
            {...attributes} // Apply attributes for draggable
          >
            <CardTitle className="text-lg font-semibold flex-1 text-foreground">
              {title}
            </CardTitle>
            <div className="flex gap-1">
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
              <Button variant="ghost" size="icon" onClick={() => closeWidget(id)} title="Close">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </CardHeader>
          {!state.isMinimized && (
            <CardContent className="flex-1 p-4 overflow-y-auto">
              {children}
            </CardContent>
          )}
          {state.isMinimized && (
            <CardContent className="flex-1 p-2 flex items-center justify-center">
              <span className="text-sm text-foreground truncate">{title}</span>
            </CardContent>
          )}
        </ResizableBox>
      </motion.div>
    </AnimatePresence>
  );
}