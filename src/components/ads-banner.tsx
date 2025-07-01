"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";

const LOCAL_STORAGE_UPGRADED_KEY = 'upgraded';

export function AdsBanner() {
  const { session, profile, loading: authLoading } = useSupabase();
  const [isVisible, setIsVisible] = useState(false);
  const [hasUpgradedLocally, setHasUpgradedLocally] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const upgradedStatus = localStorage.getItem(LOCAL_STORAGE_UPGRADED_KEY);
      setHasUpgradedLocally(upgradedStatus === 'true');
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      const isPremiumUser = profile?.is_premium === true;
      if (hasUpgradedLocally || isPremiumUser) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    }
  }, [authLoading, hasUpgradedLocally, profile?.is_premium]);

  const handleUpgrade = () => {
    toast.info("Please use the 'Upgrade' button in the header to go Premium!");
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-40 h-[50px] bg-white/10 text-white rounded-none border-t border-white/10 shadow-lg flex items-center justify-center">
      <CardContent className="flex items-center justify-between p-0 text-sm w-full max-w-screen-xl px-4">
        <p className="flex-1 text-center">
          Enjoy an ad-free experience!
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUpgrade}
          className="ml-4 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Upgrade Now
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 h-7 w-7 text-white/80 hover:bg-white/20"
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