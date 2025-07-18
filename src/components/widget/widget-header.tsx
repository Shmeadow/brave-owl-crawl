"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, X, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';

interface WidgetHeaderProps {
  title: string;
  icon: React.ElementType;
  onMaximize: () => void;
  onClose: () => void;
  onTogglePin: () => void;
  isMaximized: boolean;
  isPinned: boolean;
  isDraggable: boolean;
  isResizable: boolean;
  isInsideDock: boolean;
  isCurrentRoomWritable: boolean;
  listeners?: ReturnType<typeof useDraggable>['listeners'];
  attributes?: ReturnType<typeof useDraggable>['attributes'];
}

export function WidgetHeader({
  title,
  icon: Icon,
  onMaximize,
  onClose,
  onTogglePin,
  isMaximized,
  isPinned,
  isDraggable,
  isResizable,
  isInsideDock,
  isCurrentRoomWritable,
  listeners,
  attributes,
}: WidgetHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-1.5 border-b border-border/50 bg-background/80 backdrop-blur-md",
        isDraggable ? "cursor-grab" : "cursor-default",
        isInsideDock && "hidden" // Hide header if inside dock
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center flex-grow min-w-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary mr-2">
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        <h4 className="text-sm font-semibold truncate">{title}</h4>
      </div>
      <div className="flex items-center space-x-1">
        {/* Pinning button is now disabled */}
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => { e.stopPropagation(); onTogglePin(); }}
          className="h-6 w-6 hidden" // Added 'hidden' class to visually hide
          title={isPinned ? "Unpin Widget" : "Pin Widget"}
          disabled={true} // Explicitly disable functionality
        >
          {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          <span className="sr-only">{isPinned ? "Unpin Widget" : "Pin Widget"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => { e.stopPropagation(); onMaximize(); }}
          className="h-6 w-6"
          title={isMaximized ? "Restore Widget" : "Maximize Widget"}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="sr-only">{isMaximized ? "Restore Widget" : "Maximize Widget"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
          className="h-6 w-6"
          title="Close Widget"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Close Widget</span>
        </Button>
      </div>
    </div>
  );
}