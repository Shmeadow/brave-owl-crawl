"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pin, PinOff, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

interface SidebarProps {
  isDocked: boolean;
  onToggleDock: () => void;
  sidebarPosition: { x: number; y: number };
  onSidebarPositionChange: (newPosition: { x: number; y: number }) => void;
}

export function Sidebar({
  isDocked,
  onToggleDock,
  sidebarPosition,
  onSidebarPositionChange,
}: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "sidebar-draggable",
    data: { type: "sidebar", initialPosition: sidebarPosition },
    disabled: isDocked, // Only draggable when undocked
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : {};

  // Calculate the current position of the sidebar when it's docked
  // This is used to set the initial undocked position
  const getDockedPosition = () => {
    if (sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    }
    return { x: 0, y: 64 }; // Default if ref not ready (top-16 = 64px)
  };

  return (
    <div
      ref={setNodeRef} // Set node ref for draggable
      className={cn(
        "z-[999] flex flex-col items-center py-4 bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
        "transition-all duration-300 ease-in-out",
        isDocked
          ? "fixed left-0 top-16 h-[calc(100vh-64px)]" // Docked state
          : "absolute cursor-grab", // Undocked state
      )}
      style={{
        left: isDocked ? undefined : sidebarPosition.x,
        top: isDocked ? undefined : sidebarPosition.y,
        ...dragStyle,
      }}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-4",
          !isDocked && "w-full px-2" // Add padding for undocked state
        )}
      >
        {/* Drag handle for undocked state */}
        {!isDocked && (
          <div {...listeners} {...attributes} className="cursor-grab w-full flex justify-center py-2">
            <GripVertical className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        {/* Toggle Dock Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isDocked) {
              // When undocking, set initial position to current docked position
              const currentPos = getDockedPosition();
              onSidebarPositionChange(currentPos);
            }
            onToggleDock();
          }}
          title={isDocked ? "Undock Sidebar" : "Dock Sidebar"}
        >
          {isDocked ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
        </Button>

        {/* Existing sidebar content (placeholder for brevity) */}
        {/* You would place your actual sidebar content here */}
        <div className="h-full w-full flex flex-col items-center justify-center text-sm text-muted-foreground">
          {/* Example content */}
          <p>Sidebar Content</p>
          <p>...</p>
        </div>
      </div>
    </div>
  );
}