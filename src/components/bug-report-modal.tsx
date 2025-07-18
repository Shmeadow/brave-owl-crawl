"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BugReportButton } from './bug-report-button'; // Import the original component
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface BugReportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BugReportModal({ isOpen, onOpenChange }: BugReportModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[60vh] flex flex-col">
          <DrawerHeader className="p-4 border-b">
            <DrawerTitle>Submit Bug Report</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <BugReportButton isModal={true} onModalClose={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Submit Bug Report</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <BugReportButton isModal={true} onModalClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}