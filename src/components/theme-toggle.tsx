"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react"; // Import Sun icon
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, themes } = useTheme();

  const toggleTheme = () => {
    // Find the next theme in the available themes list
    const currentIndex = themes.indexOf(theme || 'dark'); // Default to 'dark' if theme is undefined
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Button variant="ghost" size="icon" className={cn("relative", className)} onClick={toggleTheme} title="Toggle Theme">
      {theme === 'dark' ? (
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}