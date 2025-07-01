"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Gem } from "lucide-react";

interface UpgradeButtonProps {
  onOpenUpgradeModal: () => void;
  isPremium: boolean;
}

export function UpgradeButton({ onOpenUpgradeModal, isPremium }: UpgradeButtonProps) {
  if (isPremium) {
    return (
      <Button variant="ghost" size="icon" className="text-gold" title="Premium User">
        <Gem className="h-5 w-5 fill-current" />
        <span className="sr-only">Premium User</span>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={onOpenUpgradeModal} title="Upgrade to Premium">
      <Gem className="h-5 w-5" />
      <span className="sr-only">Upgrade to Premium</span>
    </Button>
  );
}