"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LOCAL_STORAGE_UPGRADED_KEY = 'upgraded';

export function AdsBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasUpgraded, setHasUpgraded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const upgradedStatus = localStorage.getItem(LOCAL_STORAGE_UPGRADED_KEY);
      if (upgradedStatus === 'true') {
        setHasUpgraded(true);
        setIsVisible(false);
      } else {
        setIsVisible(true); // Show banner if not upgraded
      }
    }
  }, []);

  const handleUpgrade = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_UPGRADED_KEY, 'true');
      setHasUpgraded(true);
      setIsVisible(false);
      toast.success("Thank you for upgrading! Ads are now hidden.");
    }
  };

  if (!isVisible || hasUpgraded) {
    return null;
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-40 bg-primary text-primary-foreground rounded-none border-t shadow-lg">
      <CardContent className="flex items-center justify-between p-3 text-sm">
        <p className="flex-1 text-center">
          Enjoy an ad-free experience!
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUpgrade}
          className="ml-4"
        >
          Upgrade Now
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={() => setIsVisible(false)}
          title="Close Ad"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close Ad</span>
        </Button>
      </CardContent>
    </Card>
  );
}