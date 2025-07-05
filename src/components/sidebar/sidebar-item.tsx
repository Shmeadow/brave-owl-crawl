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
      <Tooltip delayDuration={100}> {/* Added delay to tooltip */}
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative h-12 rounded-full transition-all duration-200",
              "bg-transparent text-white/70 hover:bg-white/10 hover:text-white",
              isActive && "bg-white/20 text-white ring-inset ring-2 ring-white/50 box-border",
              isExpanded ? "w-full justify-start px-4" : "w-12" // Conditional width and padding
            )}
            onClick={onClick}
          >
            <Icon className={cn("h-6 w-6", isExpanded && "mr-3")} /> {/* Add margin when expanded */}
            {isExpanded && <span className="font-medium text-sm whitespace-nowrap">{label}</span>}
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        {!isExpanded && ( // Only show tooltip when not expanded
          <TooltipContent side="right" className="ml-2">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}