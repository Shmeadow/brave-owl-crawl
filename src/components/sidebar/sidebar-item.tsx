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
  isExpanded: boolean; // This prop will now always be false
}

export function SidebarItem({ icon: Icon, label, isActive, onClick, isExpanded }: SidebarItemProps) {
  // Since isExpanded will always be false, we can simplify the classNames
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}> {/* Always use a short delay for tooltips */}
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative transition-all duration-200 flex items-center",
              "h-10 w-10 justify-center rounded-md", // Changed to rounded-md
              "bg-transparent text-white/70 hover:bg-white/10 hover:text-white",
              isActive && "bg-white/20 text-white ring-inset ring-2 ring-white/50 box-border"
            )}
            onClick={onClick}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="sr-only">{label}</span> {/* Label is always screen-reader only */}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}