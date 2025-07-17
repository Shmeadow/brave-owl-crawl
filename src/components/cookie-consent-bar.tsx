"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Extend Window interface to include initializeGoogleAnalytics
declare global {
  interface Window {
    initializeGoogleAnalytics?: () => void;
    gtag?: (...args: any[]) => void;
  }
}

export function CookieConsentBar() {
  const [showBar, setShowBar] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookie_consent');
      if (consent === null) {
        setShowBar(true); // Show the bar if no consent is recorded
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted'); // Save consent
    if (window.initializeGoogleAnalytics) {
      window.initializeGoogleAnalytics();
    }
    setShowBar(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined'); // Save consent
    // Ensure gtag is a no-op if declined
    if (window.gtag) {
      window.gtag = function() {};
    }
    setShowBar(false);
  };

  if (!showBar) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed bottom-4 z-[1004]", // Position in bottom-left corner
      isMobile ? "left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-xs" : "left-4 w-72", // Responsive width and centering
      "bg-card/90 backdrop-blur-xl border border-border shadow-lg rounded-lg", // Card styling
      "animate-in slide-in-from-left-full duration-500 ease-out" // Animation
    )}>
      <CardContent className="p-4 flex flex-col items-start gap-3">
        <p className="text-sm text-foreground text-left">
          We use cookies to enhance your experience and analyze site traffic. By clicking "Accept", you agree to our use of cookies.
        </p>
        <div className="flex gap-2 w-full">
          <Button onClick={handleAccept} size="sm" className="flex-1">Accept</Button>
          <Button onClick={handleDecline} variant="outline" size="sm" className="flex-1">Decline</Button>
        </div>
      </CardContent>
    </Card>
  );
}