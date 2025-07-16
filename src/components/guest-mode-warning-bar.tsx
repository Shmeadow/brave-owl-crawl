"use client";

import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Info } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const LOCAL_STORAGE_DISMISSED_KEY = 'guest_mode_warning_dismissed';

export function GuestModeWarningBar() {
  const { session, loading: authLoading } = useSupabase();
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      const dismissed = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
      if (dismissed !== 'true') {
        setIsVisible(true);
      }
    } else {
      // If logged in, ensure it's not visible and clear dismissal flag
      setIsVisible(false);
      localStorage.removeItem(LOCAL_STORAGE_DISMISSED_KEY);
    }
  }, [session, authLoading]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed z-[905]",
      "bg-yellow-100/80 backdrop-blur-xl border-yellow-300 text-yellow-800 shadow-lg rounded-lg",
      "animate-in slide-in-from-top-full duration-500 ease-out",
      isMobile ? "top-16 left-4 right-4" : "top-16 left-1/2 -translate-x-1/2 w-full max-w-md"
    )}>
      <CardContent className="p-3 flex items-center gap-3">
        <Info className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">You are in Guest Mode.</p>
          <p>Your data is saved locally. <Link href="/login" className="underline font-medium hover:text-yellow-900">Log in</Link> to save and sync your data.</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-yellow-700 hover:bg-yellow-200" onClick={handleDismiss} title="Dismiss">
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss warning</span>
        </Button>
      </CardContent>
    </Card>
  );
}