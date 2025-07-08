"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, X, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}: WidgetHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 border-b border-border/50 bg-background/80 backdrop-blur-md",
        isDraggable ? "cursor-grab" : "cursor-default",
        isInsideDock && "hidden"
      )}
    >
      <div className="flex items-center flex-grow min-w-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary mr-2">
          {Icon && <Icon className="h-5 w-5" />} {/* Changed icon size to h-5 w-5 */}
        </div>
        <h4 className="text-sm font-semibold truncate">{title}</h4>
      </div>
      <div className="flex items-center space-x-1">
        {isCurrentRoomWritable && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            className="h-7 w-7"
            title={isPinned ? "Unpin Widget" : "Pin Widget"}
          >
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            <span className="sr-only">{isPinned ? "Unpin Widget" : "Pin Widget"}</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onMaximize(); }}
          className="h-7 w-7"
          title={isMaximized ? "Restore Widget" : "Maximize Widget"}
        >
          <Maximize2 className="h-4 w-4" />
          <span className="sr-only">{isMaximized ? "Restore Widget" : "Maximize Widget"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="h-7 w-7"
          title="Close Widget"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close Widget</span>
        </Button>
      </div>
    </div>
  );
}