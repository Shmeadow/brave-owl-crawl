"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoomOwnerControlsSection } from "@/components/spaces-widget/room-owner-controls-section";
import { RoomData } from "@/hooks/rooms/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RoomSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: RoomData | null;
  isOwnerOfCurrentRoom: boolean;
}

export function RoomSettingsDialog({ isOpen, onClose, currentRoom, isOwnerOfCurrentRoom }: RoomSettingsDialogProps) {
  if (!currentRoom || !isOwnerOfCurrentRoom) {
    return null; // Don't render if not owner or no current room
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card backdrop-blur-xl border-white/20">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Room Settings: {currentRoom.name}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <div className="py-4">
          <RoomOwnerControlsSection
            currentRoom={currentRoom}
            isOwnerOfCurrentRoom={isOwnerOfCurrentRoom}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}