"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { Loader2 } from "lucide-react";

const LOCAL_STORAGE_UPGRADED_KEY = 'upgraded';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { supabase, session, refreshProfile } = useSupabase();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      if (session && supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', session.user.id);

        if (error) {
          toast.error("Error upgrading account: " + error.message);
          console.error("Supabase upgrade error:", error);
        } else {
          toast.success("Account upgraded to Premium! Enjoy ad-free experience and more.");
          await refreshProfile();
          onClose();
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_UPGRADED_KEY, 'true');
        toast.success("Account upgraded to Premium! Enjoy ad-free experience and more.");
        onClose();
      }
    } catch (error) {
      toast.error("Failed to process upgrade. Please try again.");
      console.error("Upgrade simulation error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black/70 backdrop-blur-md border border-white/10 text-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Upgrade to Premium</DialogTitle>
          <DialogDescription className="text-white/80">
            Unlock exclusive features and an ad-free experience!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-white/80">
            For just $9.99/month, you get:
          </p>
          <ul className="list-disc list-inside space-y-1 text-white">
            <li>Ad-free experience</li>
            <li>Advanced analytics (coming soon!)</li>
            <li>Priority support (coming soon!)</li>
          </ul>
          <Button
            onClick={handleSimulatePayment}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Simulate Payment & Upgrade Now"
            )}
          </Button>
          <p className="text-xs text-white/70 text-center">
            (This is a simulated payment for demonstration purposes.)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}