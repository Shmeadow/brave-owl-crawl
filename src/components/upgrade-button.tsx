"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react"; // Using Crown icon for premium/upgrade

interface UpgradeButtonProps {
  onOpenUpgradeModal: () => void;
}

export function UpgradeButton({ onOpenUpgradeModal }: UpgradeButtonProps) {
  return (
    <Button variant="ghost" size="icon" onClick={onOpenUpgradeModal} title="Upgrade to Premium" className="group">
      <Crown className="h-6 w-6 text-gold transition-transform duration-300 ease-in-out group-hover:-translate-y-1" />
      <span className="sr-only">Upgrade to Premium</span>
    </Button>
  );
}