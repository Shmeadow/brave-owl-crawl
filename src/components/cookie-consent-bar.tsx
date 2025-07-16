"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Extend Window interface to include initializeGoogleAnalytics
declare global {
  interface Window {
    initializeGoogleAnalytics?: () => void;
    gtag?: (...args: any[]) => void;
  }
}

export function CookieConsentBar() {
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookie_consent');
      if (consent === null) {
        setShowBar(true);
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    if (window.initializeGoogleAnalytics) {
      window.initializeGoogleAnalytics();
    }
    setShowBar(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
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
      "fixed bottom-0 left-0 right-0 z-[1004] rounded-none border-b-0 border-x-0",
      "bg-card/90 backdrop-blur-xl shadow-lg",
      "animate-in slide-in-from-bottom-full duration-500 ease-out"
    )}>
      <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-foreground text-center sm:text-left flex-1">
          We use cookies to enhance your experience and analyze site traffic. By clicking "Accept", you agree to our use of cookies.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={handleAccept} size="sm">Accept</Button>
          <Button onClick={handleDecline} variant="outline" size="sm">Decline</Button>
        </div>
      </CardContent>
    </Card>
  );
}