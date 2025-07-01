"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  }, [isOpen]); // Re-check status when modal opens

  const handleUpgrade = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_UPGRADED_KEY, 'true');
      setHasUpgraded(true);
      toast.success("Thank you for upgrading! Ads are now hidden.");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[1001] bg-card/40 backdrop-blur-xl border-white/20"> {/* Applied glass effect here */}
        <DialogHeader>
          <DialogTitle>{hasUpgraded ? "Ad-Free Experience" : "Upgrade for Ad-Free"}</DialogTitle>
          <DialogDescription>
            {hasUpgraded
              ? "You are currently enjoying an ad-free experience. Thank you for your support!"
              : "Upgrade to remove ads and enjoy an uninterrupted experience."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {!hasUpgraded && (
            <Button onClick={handleUpgrade} className="w-full">
              Upgrade Now
            </Button>
          )}
          <p className="text-sm text-muted-foreground text-center">
            This is a simulated upgrade. In a real application, this would involve a payment process.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}