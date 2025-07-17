"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PricingContent } from '@/components/pricing-content';
import { useSupabase } from '@/integrations/supabase/auth';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils'; // Import cn

export default function PricingPage() {
  const { session } = useSupabase();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true); // Dialog is open by default

  const handleClose = () => {
    setIsOpen(false);
    router.push('/dashboard'); // Redirect to dashboard on close
  };

  const handleUpgrade = () => {
    if (session) {
      router.push('/dashboard'); // Or to a checkout flow
    } else {
      router.push('/login');
    }
    setIsOpen(false); // Close dialog after action
  };

  // This function will be called when the dialog's open state changes
  const handleDialogStateChange = (newOpenState: boolean) => {
    setIsOpen(newOpenState);
    if (!newOpenState) { // If the dialog is closing
      router.push('/dashboard'); // Redirect to dashboard
    }
  };

  // Ensure dialog re-opens if user navigates back to /pricing
  useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogStateChange}>
      <DialogContent className={cn(
        "max-w-4xl h-[90vh] flex flex-col p-0",
        "sm:max-w-3xl md:max-w-4xl lg:max-w-5xl", // Adjust max-width for larger screens
        "w-[calc(100vw-1rem)] h-[95vh] sm:w-[calc(100vw-2rem)] sm:h-[90vh]" // Make it fill more of the screen on mobile
      )}>
        <DialogHeader className="p-3 sm:p-4 border-b flex flex-row items-center justify-between"> {/* Reduced padding */}
          <DialogTitle className="text-xl sm:text-2xl font-bold">Upgrade Your Plan</DialogTitle> {/* Reduced font size */}
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5 sm:h-6 sm:w-6" /> {/* Reduced icon size */}
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4 sm:p-6"> {/* Reduced padding */}
          <div className="text-center mb-6 sm:mb-8"> {/* Reduced margin-bottom */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight"> {/* Reduced font size */}
              Build your cozy workspace for less than a coffee.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Choose the plan that's right for you.</p> {/* Reduced font size and margin-top */}
          </div>
          <PricingContent onUpgrade={handleUpgrade} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}