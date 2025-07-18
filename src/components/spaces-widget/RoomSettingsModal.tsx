"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RoomSettingsContent } from './RoomSettingsContent';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { RoomData } from '@/hooks/rooms/types';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  room: RoomData;
  onRoomCreated: (room: RoomData) => void; // Passed through to CreatePersonalRoomForm
  isCurrentRoomWritable: boolean; // Passed through
  currentRoomId: string | null; // Passed through
  currentRoomName: string; // Passed through
}

export function RoomSettingsModal({
  isOpen,
  onOpenChange,
  room,
  onRoomCreated,
  isCurrentRoomWritable,
  currentRoomId,
  currentRoomName,
}: RoomSettingsModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="p-4 border-b">
            <DrawerTitle>Room Settings</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <RoomSettingsContent room={room} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Room Settings</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <RoomSettingsContent room={room} />
        </div>
      </DialogContent>
    </Dialog>
  );
}