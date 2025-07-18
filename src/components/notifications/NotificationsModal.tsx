"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotificationsDropdown } from './notifications-dropdown'; // Import the original dropdown content
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface NotificationsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NotificationsModal({ isOpen, onOpenChange }: NotificationsModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] flex flex-col">
          <DrawerHeader className="p-4 border-b">
            <DrawerTitle>Notifications</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <NotificationsDropdown isModal={true} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <NotificationsDropdown isModal={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}