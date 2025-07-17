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
      <Tooltip delayDuration={isExpanded ? 100000 : 100}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative transition-all duration-200 flex items-center",
              isExpanded ? "w-full justify-start px-3 h-9" : "h-10 w-10 justify-center rounded-full",
              "bg-transparent text-white/70 hover:bg-white/10 hover:text-white",
              isActive && "bg-white/20 text-white ring-inset ring-2 ring-white/50 box-border"
            )}
            onClick={onClick}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {isExpanded && <span className="ml-3 text-sm font-medium truncate">{label}</span>}
            <span className={cn(!isExpanded && "sr-only")}>{label}</span>
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