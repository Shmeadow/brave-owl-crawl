"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minimize, X, Pin, PinOff, Maximize } from "lucide-react";

interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onPositionChange: (newPosition: { x: number; y: number }) => void;
  onSizeChange: (newSize: { width: number; height: number }) => void;
  onBringToFront: () => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  isMinimized: boolean;
  isDocked: boolean;
  toggleDocked: (id: string) => void;
}

export function Widget({
  id,
  title,
  children,
  position,
  size,
  zIndex,
  onPositionChange,
  onSizeChange,
  onBringToFront,
  onClose,
  onMinimize,
  isMinimized,
  isDocked,
  toggleDocked,
}: WidgetProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const initialMousePos = useRef({ x: 0, y: 0 });
  const initialWidgetPos = useRef({ x: 0, y: 0 });
  const initialWidgetSize = useRef({ width: 0, height: 0 });
  const resizeDirection = useRef("");

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isDocked) return; // Prevent dragging when docked

    e.preventDefault(); // Prevent default browser drag behavior
    onBringToFront(); // Bring to front when dragging starts
    isDraggingRef.current = true;
    initialMousePos.current = { x: e.clientX, y: e.clientY };
    initialWidgetPos.current = { x: position.x, y: position.y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = moveEvent.clientX - initialMousePos.current.x;
        const dy = moveEvent.clientY - initialMousePos.current.y;
        onPositionChange({
          x: initialWidgetPos.current.x + dx,
          y: initialWidgetPos.current.y + dy,
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [position, onPositionChange, onBringToFront, isDocked]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    if (isDocked || isMinimized) return; // Prevent resizing when docked or minimized

    e.stopPropagation(); // Prevent dragging when resizing
    onBringToFront(); // Bring to front when resizing starts
    isResizingRef.current = true;
    resizeDirection.current = direction;
    initialMousePos.current = { x: e.clientX, y: e.clientY };
    initialWidgetSize.current = { width: size.width, height: size.height };
    initialWidgetPos.current = { x: position.x, y: position.y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isResizingRef.current) {
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;

        const dx = moveEvent.clientX - initialMousePos.current.x;
        const dy = moveEvent.clientY - initialMousePos.current.y;

        switch (resizeDirection.current) {
          case "bottom-right":
            newWidth = initialWidgetSize.current.width + dx;
            newHeight = initialWidgetSize.current.height + dy;
            break;
          case "bottom-left":
            newWidth = initialWidgetSize.current.width - dx;
            newHeight = initialWidgetSize.current.height + dy;
            newX = initialWidgetPos.current.x + dx;
            break;
          case "top-right":
            newWidth = initialWidgetSize.current.width + dx;
            newHeight = initialWidgetSize.current.height - dy;
            newY = initialWidgetPos.current.y + dy;
            break;
          case "top-left":
            newWidth = initialWidgetSize.current.width - dx;
            newHeight = initialWidgetSize.current.height - dy;
            newX = initialWidgetPos.current.x + dx;
            newY = initialWidgetPos.current.y + dy;
            break;
          case "right":
            newWidth = initialWidgetSize.current.width + dx;
            break;
          case "bottom":
            newHeight = initialWidgetSize.current.height + dy;
            break;
          case "left":
            newWidth = initialWidgetSize.current.width - dx;
            newX = initialWidgetPos.current.x + dx;
            break;
          case "top":
            newHeight = initialWidgetSize.current.height - dy;
            newY = initialWidgetPos.current.y + dy;
            break;
        }

        onSizeChange({ width: Math.max(newWidth, 200), height: Math.max(newHeight, 100) });
        onPositionChange({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [position, size, onPositionChange, onSizeChange, onBringToFront, isDocked, isMinimized]);

  const handleDoubleClick = useCallback(() => {
    if (!isDocked) { // Only minimize/maximize if not docked
      onMinimize(id);
    }
  }, [id, onMinimize, isDocked]);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "shadow-lg flex flex-col overflow-hidden transition-all duration-200 ease-in-out group pointer-events-auto",
        // Base styling for floating/minimized
        !isDocked && (isMinimized ? "rounded-lg" : "rounded-lg"), // Always rounded when floating
        // Docked specific styling
        isDocked && "fixed top-16 right-0 h-[calc(100vh-4rem)] w-[300px] rounded-none", // Use fixed positioning for docked
        // Background and text colors
        "bg-card text-card-foreground",
        // Z-index for floating widgets
        !isDocked && "absolute"
      )}
      style={!isDocked ? { // Apply style only if not docked
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '192px' : `${size.width}px`, // 192px for w-48
        height: isMinimized ? '40px' : `${size.height}px`, // 40px for h-10
        zIndex: zIndex,
      } : {}}
    >
      <CardHeader
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "flex flex-row items-center justify-between p-2 border-b cursor-grab",
          isDocked && "cursor-default", // Docked widgets are not draggable by header
          isMinimized && "cursor-grab" // Minimized widgets are still draggable
        )}
      >
        <CardTitle className="text-sm font-semibold flex-grow truncate">
          {title}
        </CardTitle>
        <div className="flex gap-1">
          {/* Minimize/Maximize Button */}
          <Button variant="ghost" size="icon" onClick={() => onMinimize(id)} title={isMinimized ? "Maximize" : "Minimize"}>
            {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
            <span className="sr-only">{isMinimized ? "Maximize" : "Minimize"}</span>
          </Button>
          {/* Pin/Undock Button */}
          <Button variant="ghost" size="icon" onClick={() => toggleDocked(id)} title={isDocked ? "Undock" : "Dock to Right"}>
            {isDocked ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            <span className="sr-only">{isDocked ? "Undock" : "Dock to Right"}</span>
          </Button>
          {/* Close Button */}
          <Button variant="ghost" size="icon" onClick={() => onClose(id)} title="Close">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardHeader>
      {!isMinimized && (
        <CardContent className="flex-grow p-4 overflow-auto">
          {children}
        </CardContent>
      )}
      {/* Resize handles are only shown when not minimized and not docked */}
      {!isDocked && !isMinimized && (
        <>
          {/* Resize handles */}
          <div className="absolute w-3 h-3 bg-muted/50 border border-border rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-nwse-resize top-0 left-0 -mt-1.5 -ml-1.5" onMouseDown={(e) => handleResizeMouseDown(e, "top-left")} />
          <div className="absolute w-3 h-3 bg-muted/50 border border-border rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-nesw-resize top-0 right-0 -mt-1.5 -mr-1.5" onMouseDown={(e) => handleResizeMouseDown(e, "top-right")} />
          <div className="absolute w-3 h-3 bg-muted/50 border border-border rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-nesw-resize bottom-0 left-0 -mb-1.5 -ml-1.5" onMouseDown={(e) => handleResizeMouseDown(e, "bottom-left")} />
          <div className="absolute w-3 h-3 bg-muted/50 border border-border rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-nwse-resize bottom-0 right-0 -mb-1.5 -mr-1.5" onMouseDown={(e) => handleResizeMouseDown(e, "bottom-right")} />
          <div className="absolute w-full h-3 bg-muted/50 border-t border-b border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-ns-resize top-0 left-0 -mt-1.5" onMouseDown={(e) => handleResizeMouseDown(e, "top")} />
          <div className="absolute w-full h-3 bg-muted/50 border-t border-b border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-ns-resize bottom-0 left-0 -mb-1.5" onMouseDown={(e) => handleResizeMouseDown(e, "bottom")} />
          <div className="absolute w-3 h-full bg-muted/50 border-l border-r border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize left-0 top-0 -ml-1.5" onMouseDown={(e) => handleResizeMouseDown(e, "left")} />
          <div className="absolute w-3 h-full bg-muted/50 border-l border-r border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize right-0 top-0 -mr-1.5" onMouseDown={(e) => handleResizeMouseDown(e, "right")} />
        </>
      )}
    </Card>
  );
}