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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <Target className="h-12 w-12 mx-auto text-primary mb-4" />
          <DialogTitle className="text-2xl">Welcome Back, {userName}!</DialogTitle>
          <DialogDescription className="pt-2">
            {firstGoal
              ? `Your current focus is on: "${firstGoal.title}".`
              : "You're all caught up on your goals."}
            <br />
            You are currently in: <span className="font-semibold text-foreground">{currentRoomName}</span>.
            <br />
            Let's get to it!
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <Button onClick={onClose} className="w-full">Let's Go</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}