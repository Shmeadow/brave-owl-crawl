"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { UpgradeButton } from "./upgrade-button";
import { cn } from "@/lib/utils"; // Ensure cn utility is imported

interface HeaderProps {
  onOpenUpgradeModal: () => void;
}

export function Header({ onOpenUpgradeModal }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="text-lg font-bold">My App</div>
      <div className="flex items-center space-x-2">
        <UpgradeButton onOpenUpgradeModal={onOpenUpgradeModal} />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="Toggle Theme"
          className={cn(
            "transition-colors duration-200",
            mounted && theme === "dark" && "bg-gray-100/20 hover:bg-gray-100/30", // Subtle background for dark theme
            mounted && theme === "light" && "bg-gray-800/20 hover:bg-gray-800/30" // Subtle background for light theme
          )}
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )
          ) : null}
        </Button>
      </div>
    </header>
  );
}