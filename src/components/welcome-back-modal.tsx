"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoalData } from '@/hooks/use-goals';
import { UserProfile } from '@/integrations/supabase/auth';
import { Target } from 'lucide-react';

interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  firstGoal: GoalData | null;
  currentRoomName: string; // New prop
}

export function WelcomeBackModal({ isOpen, onClose, profile, firstGoal, currentRoomName }: WelcomeBackModalProps) {
  const userName = profile?.first_name || 'there';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-4"> {/* Reduced max-width and padding for mobile */}
        <DialogHeader className="text-center">
          <Target className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary mb-3 sm:mb-4" /> {/* Reduced icon size and margin for mobile */}
          <DialogTitle className="text-xl sm:text-2xl">Welcome Back, {userName}!</DialogTitle> {/* Reduced font size for mobile */}
          <DialogDescription className="pt-1 sm:pt-2 text-sm sm:text-base"> {/* Reduced padding and font size for mobile */}
            {firstGoal
              ? `Your current focus is on: "${firstGoal.title}".`
              : "You're all caught up on your goals."}
            <br />
            You are currently in: <span className="font-semibold text-foreground">{currentRoomName}</span>.
            <br />
            Let's get to it!
          </DialogDescription>
        </DialogHeader>
        <div className="pt-3 sm:pt-4"> {/* Reduced padding for mobile */}
          <Button onClick={onClose} className="w-full h-9 sm:h-10 text-sm sm:text-base">Let's Go</Button> {/* Reduced height and font size for mobile */}
        </div>
      </DialogContent>
    </Dialog>
  );
}