"use client";

import React, { useState, useEffect } from 'react';
import { useCurrentRoom } from '@/hooks/use-current-room';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoomPermissionMessage() {
  const { isCurrentRoomWritable, currentRoomName } = useCurrentRoom();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the message if not writable and not on the Dashboard
    if (!isCurrentRoomWritable && currentRoomName !== "Dashboard") {
      setIsVisible(true);
    } else {
      // Hide the message if writable or on the Dashboard
      setIsVisible(false);
    }
  }, [isCurrentRoomWritable, currentRoomName]);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed top-16 left-1/2 -translate-x-1/2 z-[905]",
      "bg-blue-100/80 backdrop-blur-xl border-blue-300 text-blue-800 shadow-lg rounded-lg",
      "animate-in slide-in-from-top-full duration-500 ease-out",
      "w-full max-w-md",
      "flex items-center justify-center p-2 gap-2"
    )}>
      <Info className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 text-xs text-center">
        <p className="font-semibold inline">Read-Only Mode:</p>
        <p className="inline ml-1">You do not have permission to make changes in this room.</p>
      </div>
    </Card>
  );
}