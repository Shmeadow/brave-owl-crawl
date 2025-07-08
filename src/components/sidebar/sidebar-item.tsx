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
  isExpanded: boolean; // New prop
}

export function SidebarItem({ icon: Icon, label, isActive, onClick, isExpanded }: SidebarItemProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative h-11 w-11 rounded-full transition-all duration-200 flex items-center justify-center", // Reduced size
              "bg-transparent text-white/70 hover:bg-white/10 hover:text-white",
              isActive && "bg-white/20 text-white ring-inset ring-2 ring-white/50 box-border"
            )}
            onClick={onClick}
          >
            <Icon className="h-5 w-5" /> {/* Reduced icon size */}
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}