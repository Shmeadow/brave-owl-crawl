"use client";

import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Info, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
          "bg-yellow-100/80 backdrop-blur-xl border-yellow-300 text-yellow-800 shadow-lg rounded-full p-1.5", // Reduced padding for mobile
          "flex items-center gap-1.5 cursor-pointer", // Reduced gap for mobile
          "animate-in slide-in-from-left-full duration-500 ease-out"
        )}
        onClick={handleExpand}
        title="Expand Guest Mode Warning"
      >
        <Info className="h-4 w-4 flex-shrink-0" /> {/* Reduced icon size for mobile */}
        <span className="text-xs font-semibold whitespace-nowrap">Guest Mode</span> {/* Reduced font size for mobile */}
        <ChevronUp className="h-3.5 w-3.5" /> {/* Reduced icon size for mobile */}
      </Card>
    );
  }

  // Full display mode
  return (
    <Card className={cn(
      "fixed z-[905]",
      "bg-yellow-100/80 backdrop-blur-xl border-yellow-300 text-yellow-800 shadow-lg rounded-lg",
      "animate-in slide-in-from-top-full duration-500 ease-out",
      isMobile ? "top-16 left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] max-w-xs" : "top-16 left-1/2 -translate-x-1/2 w-full max-w-md" // Adjusted width for mobile
    )}>
      <CardContent className="p-2.5 flex items-center gap-2.5"> {/* Reduced padding and gap for mobile */}
        <Info className="h-4 w-4 flex-shrink-0" /> {/* Reduced icon size for mobile */}
        <div className="flex-1 text-xs"> {/* Reduced font size for mobile */}
          <p className="font-semibold">You are in Guest Mode.</p>
          <p>Your data is saved locally. <Link href="/login" className="underline font-medium hover:text-yellow-900">Log in</Link> to save and sync your data.</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-700 hover:bg-yellow-200" onClick={handleDismiss} title="Dismiss"> {/* Reduced size for mobile */}
          <X className="h-3.5 w-3.5" /> {/* Reduced icon size for mobile */}
          <span className="sr-only">Dismiss warning</span>
        </Button>
      </CardContent>
    </Card>
  );
}