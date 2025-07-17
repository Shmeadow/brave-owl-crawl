"use client";

import * as React from "react";
import { Moon } from "lucide-react"; // Only Moon icon needed
import { useTheme } from "next-themes"; // Keep useTheme to apply the class

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Import cn

interface ThemeToggleProps {
  className?: string; // Add className prop
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme } = useTheme(); // Get current theme to potentially show different icon if needed, but no longer for setting

  // This component now just displays a static Moon icon, as theme is fixed to dark/cozy.
  return (
    <Button variant="ghost" size="icon" className={cn("relative", className)} title="Dark Theme Active">
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100" />
      <span className="sr-only">Dark theme active</span>
    </Button>
  );
}