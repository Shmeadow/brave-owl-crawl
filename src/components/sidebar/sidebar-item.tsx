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
              "relative h-12 rounded-full transition-all duration-200",
              "bg-transparent text-white/70 hover:bg-white/10 hover:text-white",
              isActive && "bg-white/20 text-white ring-inset ring-2 ring-white/50 box-border",
              isExpanded ? "w-full flex-col justify-center px-2 h-16" : "w-12 flex-col justify-center" // Conditional width, padding, and height
            )}
            onClick={onClick}
          >
            <Icon className={cn("h-6 w-6", isExpanded && "mb-1")} /> {/* Add margin-bottom when expanded */}
            {isExpanded && <span className="font-medium text-xs whitespace-nowrap text-center">{label}</span>}
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        {!isExpanded && (
          <TooltipContent side="right" className="ml-2">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}