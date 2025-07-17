"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils"; // Import cn

interface UpgradeButtonProps {
  className?: string; // Add className prop
}

export function UpgradeButton({ className }: UpgradeButtonProps) {
  return (
    <Link href="/pricing" passHref>
      <Button variant="ghost" size="icon" title="Learn More About Premium" className={cn("group", className)}>
        {/* Wrap children in a single span to satisfy React.Children.only */}
        <span className="flex items-center justify-center">
          <Crown className="h-6 w-6 text-gold transition-transform duration-300 ease-in-out group-hover:-translate-y-1" />
          <span className="sr-only">Learn More About Premium</span>
        </span>
      </Button>
    </Link>
  );
}