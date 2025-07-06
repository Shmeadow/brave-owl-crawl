"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PricingPage } from './pricing-page';
import { ScrollArea } from "@/components/ui/scroll-area";

const LOCAL_STORAGE_UPGRADED_KEY = 'upgraded';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [hasUpgraded, setHasUpgraded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const upgradedStatus = localStorage.getItem(LOCAL_STORAGE_UPGRADED_KEY);
      setHasUpgraded(upgradedStatus === 'true');
    }
  }, [isOpen]);

  const handleUpgrade = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_UPGRADED_KEY, 'true');
      setHasUpgraded(true);
      toast.success("7-Day Trial Activated! Welcome to Premium.");
      onClose();
    }
  };

  if (hasUpgraded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md z-[1001] bg-card backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">You're a Premium Member!</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Thank you for your support. You have access to all features.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl z-[1001] bg-transparent border-none shadow-none p-0">
        <ScrollArea className="max-h-[90vh] rounded-lg">
          <PricingPage onUpgrade={handleUpgrade} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}