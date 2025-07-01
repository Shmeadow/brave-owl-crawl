"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minimize2, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidget } from "./widget-context";
import { AnimatePresence, motion } from "framer-motion";

interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number }; // For fixed positioning, no drag yet
  initialWidth?: string;
  initialHeight?: string;
}

export function Widget({
  id,
  title,
  children,
  initialPosition = { x: 50, y: 50 }, // Default position
  initialWidth = "w-[400px]",
  initialHeight = "h-[500px]",
}: WidgetProps) {
  const { widgetStates, minimizeWidget, restoreWidget, closeWidget } = useWidget();
  const state = widgetStates[id] || { isOpen: false, isMinimized: false };

  if (!state.isOpen) {
    return null; // Don't render if not open
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed z-40", // Lower z-index than chat (z-50)
          initialWidth,
          initialHeight,
          state.isMinimized ? "h-auto w-auto" : "", // Adjust size for minimized state
          "bg-card/80 backdrop-blur-md border border-border rounded-lg shadow-xl",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-in-out"
        )}
        style={{
          top: `${initialPosition.y}px`,
          left: `${initialPosition.x}px`,
        }}
      >
        <CardHeader className={cn(
          "flex flex-row items-center justify-between p-3 border-b border-border",
          state.isMinimized ? "cursor-pointer" : ""
        )}
          onClick={state.isMinimized ? () => restoreWidget(id) : undefined}
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
      </motion.div>
    </AnimatePresence>
  );
}