"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean; // New prop
}

export function SidebarItem({ icon: Icon, label, isActive, onClick, disabled = false }: SidebarItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-12 w-12 rounded-full transition-all duration-200",
              "bg-transparent text-white/70 hover:bg-white/10 hover:text-white",
              isActive && "bg-white/20 text-white ring-inset ring-2 ring-white/50 box-border", // Changed ring to ring-inset
              disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-white/70" // Disabled styles
            )}
            onClick={onClick}
            disabled={disabled} // Apply disabled prop
          >
            <Icon className="h-6 w-6" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          {label}
          {disabled && <span className="block text-xs text-red-300"> (Read-only room)</span>} {/* Add tooltip hint */}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}