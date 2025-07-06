"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import Link from "next/link";

export function UpgradeButton() {
  return (
    <Link href="/pricing" passHref>
      <Button variant="ghost" size="icon" title="Learn More About Premium" className="group">
        <Crown className="h-6 w-6 text-gold transition-transform duration-300 ease-in-out group-hover:-translate-y-1" />
        <span className="sr-only">Learn More About Premium</span>
      </Button>
    </Link>
  );
}