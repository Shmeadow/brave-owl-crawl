"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GuestWarningBar() {
  const [isDocked, setIsDocked] = useState(false); // false means "docked out" (visible bar)

  const toggleDock = () => {
    setIsDocked(!isDocked);
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 z-50",
        "bg-yellow-500 text-yellow-950 p-2 shadow-lg",
        "flex items-center transition-all duration-300 ease-in-out",
        isDocked ? "w-10 h-10 rounded-tr-lg" : "w-full max-w-xs rounded-tr-lg"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDock}
        className={cn(
          "h-6 w-6 text-yellow-950 hover:bg-yellow-600",
          isDocked ? "mr-0" : "mr-2"
        )}
      >
        {isDocked ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        <span className="sr-only">{isDocked ? "Expand Warning" : "Collapse Warning"}</span>
      </Button>
      {!isDocked && (
        <span className="text-sm font-medium flex-grow">
          You are browsing as a guest. Data is not saved unless you log in.
        </span>
      )}
    </div>
  );
}