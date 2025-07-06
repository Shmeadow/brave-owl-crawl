"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface UpgradeButtonProps {
  onOpenUpgradeModal: () => void;
}

export function UpgradeButton({ onOpenUpgradeModal }: UpgradeButtonProps) {
  return (
    <Button variant="ghost" size="icon" onClick={onOpenUpgradeModal} title="Upgrade to Premium">
      <img src="/icons/crown.gif" alt="Premium" className="h-6 w-6" />
      <span className="sr-only">Upgrade to Premium</span>
    </Button>
  );
}