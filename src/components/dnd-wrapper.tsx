"use client";

import React from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useWidget } from "@/components/widget/widget-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { WidgetContainer } from "@/components/widget/widget-container";
import { Toaster } from "@/components/ui/sonner";

interface DndWrapperProps {
  children: React.ReactNode;
  isSidebarDocked: boolean;
  onToggleDock: () => void;
  sidebarPosition: { x: number; y: number };
  onSidebarPositionChange: (newPosition: { x: number; y: number }) => void;
}

export function DndWrapper({
  children,
  isSidebarDocked,
  onToggleDock,
  sidebarPosition,
  onSidebarPositionChange,
}: DndWrapperProps) {
  const { updateWidgetPositionFromDrag } = useWidget();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (active.data.current?.type === "widget") {
      updateWidgetPositionFromDrag(active.data.current.id, delta);
    } else if (active.data.current?.type === "sidebar") {
      const initialPosition = active.data.current?.initialPosition;
      if (initialPosition) {
        onSidebarPositionChange({
          x: initialPosition.x + delta.x,
          y: initialPosition.y + delta.y,
        });
      }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {children}
      <Sidebar
        isDocked={isSidebarDocked}
        onToggleDock={onToggleDock}
        sidebarPosition={sidebarPosition}
        onSidebarPositionChange={onSidebarPositionChange}
      />
      <WidgetContainer />
      <Toaster />
    </DndContext>
  );
}