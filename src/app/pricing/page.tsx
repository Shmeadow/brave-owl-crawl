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
  // DialogTitle, // Removed DialogTitle import
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  // Ensure dialog re-opens if user navigates back to /pricing
  useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-end"> {/* Changed justify-between to justify-end */}
          {/* DialogTitle removed */}
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Build your cozy workspace for less than a coffee.
            </h1>
            <p className="text-muted-foreground mt-2">Choose the plan that's right for you.</p>
          </div>
          <PricingContent onUpgrade={handleUpgrade} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}