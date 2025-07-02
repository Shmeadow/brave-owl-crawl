"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { Widget } from "@/components/widget/widget";
import { useWidget } from "@/components/widget/widget-context"; // Corrected import
import { useCurrentRoom } from "@/hooks/use-current-room";

export function Sidebar() {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { activeWidgets: widgets, updateWidgetPosition, updateWidgetSize, bringWidgetToFront, minimizeWidget, maximizeWidget, togglePinned: pinWidget, closeWidget } = useWidget(); // Corrected hook usage
  const { currentRoom } = useCurrentRoom();

  const { setNodeRef } = useDroppable({
    id: "sidebar-droppable",
  });

  const isCurrentRoomWritable = currentRoom?.allow_guest_write || currentRoom?.creator_id === currentRoom?.user_id;

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed inset-x-1/2 -translate-x-1/2 top-16 z-50 flex flex-col items-center py-4",
        "bg-card backdrop-blur-xl border-white/20 h-[calc(100vh-4rem)] overflow-y-auto max-w-md", // Added transparency, height, overflow, and max-width
        "pointer-events-none" // Allow clicks to pass through unless on a widget
      )}
    >
      <div ref={setNodeRef} className="w-full h-full flex flex-col items-center gap-4 p-4 pointer-events-auto">
        {widgets.map((widget) => (
          <Widget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            icon={widget.icon}
            content={widget.content}
            isMinimized={widget.isMinimized}
            isMaximized={widget.isMaximized}
            isPinned={widget.isPinned}
            isTopmost={widget.zIndex === Math.max(...widgets.map(w => w.zIndex))}
            position={widget.position}
            size={widget.size}
            zIndex={widget.zIndex}
            onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)}
            onBringToFront={() => bringWidgetToFront(widget.id)}
            onMinimize={minimizeWidget}
            onMaximize={maximizeWidget}
            onPin={pinWidget}
            onClose={closeWidget}
            isCurrentRoomWritable={isCurrentRoomWritable}
          />
        ))}
      </div>
    </div>
  );
}