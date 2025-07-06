"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react"; // Import the static icon

interface UpgradeButtonProps {
  onOpenUpgradeModal: () => void;
}

export function UpgradeButton({ onOpenUpgradeModal }: UpgradeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onOpenUpgradeModal}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Upgrade to Premium"
    >
      {isHovered ? (
        <img src="/icons/crown.gif" alt="Premium" className="h-8 w-8" />
      ) : (
        <Crown className="h-8 w-8" />
      )}
      <span className="sr-only">Upgrade to Premium</span>
    </Button>
  );
}