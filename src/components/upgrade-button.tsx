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
      <Button variant="ghost" size="icon" title="Learn More About Premium" className={cn("group h-8 w-8", className)}>
        <Crown className="h-4 w-4 text-gold transition-transform duration-300 ease-in-out group-hover:-translate-y-1" />
        <span className="sr-only">Learn More About Premium</span>
      </Button>
    </Link>
  );
}