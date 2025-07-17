"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Keep Card for compact mode
import { X, Info, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabase } from '@/integrations/supabase/auth'; // Import useSupabase

const LOCAL_STORAGE_DISMISSED_KEY = 'guest_mode_warning_dismissed';

export function GuestModeWarningBar() {
  const { session, loading: authLoading } = useSupabase();
  const [displayMode, setDisplayMode] = useState<'full' | 'compact' | 'hidden'>(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
      return dismissed === 'true' ? 'compact' : 'full';
    }
    return 'full';
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      const dismissed = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
      if (dismissed === 'true') {
        setDisplayMode('compact');
      } else {
        setDisplayMode('full');
      }
    } else {
      setDisplayMode('hidden');
      localStorage.removeItem(LOCAL_STORAGE_DISMISSED_KEY);
    }
  }, [session, authLoading]);

  const handleDismiss = () => {
    setDisplayMode('compact');
    localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, 'true');
  };

  const handleExpand = () => {
    setDisplayMode('full');
    localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, 'false'); // Reset dismissed state
  };

  if (displayMode === 'hidden') {
    return null;
  }

  if (displayMode === 'compact') {
    return (
      <Card
        className={cn(
          "fixed bottom-4 left-4 z-[905]",
          "bg-yellow-100/80 backdrop-blur-xl border-yellow-300 text-yellow-800 shadow-lg rounded-full", // Apply rounded-full here
          "flex items-center cursor-pointer", // Removed gap-2 here
          "animate-in slide-in-from-left-full duration-500 ease-out",
          isMobile ? "px-2 py-1 gap-1 w-fit" : "p-2 gap-2" // Added gap-1 and w-fit for mobile, kept p-2 and gap-2 for desktop
        )}
        onClick={handleExpand}
        title="Expand Guest Mode Warning"
      >
        <Info className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "flex-shrink-0")} /> {/* Conditional icon size */}
        <span className={cn(isMobile ? "text-xs" : "text-sm", "font-semibold whitespace-nowrap")}>Guest Mode</span> {/* Conditional text size */}
        <ChevronUp className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} /> {/* Conditional icon size */}
      </Card>
    );
  }

  // Full display mode
  return (
    <div className={cn( // Changed from Card to div
      "fixed z-[905]",
      "bg-yellow-100/80 backdrop-blur-xl border-yellow-300 text-yellow-800 shadow-lg rounded-full", // Apply rounded-full here
      "animate-in slide-in-from-top-full duration-500 ease-out",
      isMobile ? "top-24" : "top-16", // Adjusted for mobile
      "left-1/2 -translate-x-1/2 w-full max-w-md", // Max width for desktop, full width for mobile
      "flex items-center justify-between p-2 gap-2" // Horizontal layout, reduced padding
    )}>
      <Info className="h-4 w-4 flex-shrink-0" /> {/* Smaller icon */}
      <div className="flex-1 text-xs"> {/* Smaller text */}
        <p className="font-semibold inline">You are in Guest Mode.</p>
        <p className="inline ml-1">Your data is saved locally. <Link href="/login" className="underline font-medium hover:text-yellow-900">Log in</Link> to save and sync your data.</p>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-700 hover:bg-yellow-200" onClick={handleDismiss} title="Dismiss">
        <X className="h-3 w-3" /> {/* Smaller icon */}
        <span className="sr-only">Dismiss warning</span>
      </Button>
    </div>
  );
}