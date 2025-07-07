"use client";

import React, { useState } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { useGoals } from '@/hooks/use-goals';
import { useWidget } from '@/components/widget/widget-provider';
import { useFocusSession } from '@/context/focus-session-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Target, Zap, Meh, BatteryLow } from 'lucide-react';
import { cn } from '@/lib/utils';

const moods = [
  { name: 'Energized', icon: Zap, color: 'text-green-500' },
  { name: 'Neutral', icon: Meh, color: 'text-yellow-500' },
  { name: 'Tired', icon: BatteryLow, color: 'text-red-500' },
];

export function PersonalizedKickoff() {
  const { profile, loading: authLoading } = useSupabase();
  const { goals, loading: goalsLoading } = useGoals();
  const { toggleWidget } = useWidget();
  const { startFocusSession } = useFocusSession();

  const [step, setStep] = useState<'mood' | 'kickoff'>('mood');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const loading = authLoading || goalsLoading;

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  };

  const primaryGoal = goals.find(goal => !goal.completed);
  const userName = profile?.first_name || 'there';

  const handleSelectMood = (moodName: string) => {
    setSelectedMood(moodName);
    setStep('kickoff');
  };

  const handleStartFocus = () => {
    if (primaryGoal) {
      startFocusSession(primaryGoal.title);
      toggleWidget('timer', 'Timer');
    }
  };

  const getMotivationalText = () => {
    switch (selectedMood) {
      case 'Energized':
        return "You're feeling great! Let's channel that energy and make some serious progress.";
      case 'Tired':
        return "Feeling a bit low? No problem. Even a short, focused session can make a big difference. Let's do this, one step at a time.";
      case 'Neutral':
      default:
        return "This is prime time for clarity. Let's dive in and turn ideas into structure.";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === 'mood') {
    return (
      <Card className="w-full h-full bg-transparent border-none shadow-none flex flex-col items-center justify-center text-center p-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">How are you feeling?</CardTitle>
          <CardDescription>Let's tailor your session to your energy level.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          {moods.map(mood => (
            <Button
              key={mood.name}
              variant="outline"
              className="flex flex-col h-24 w-24 items-center justify-center gap-2"
              onClick={() => handleSelectMood(mood.name)}
            >
              <mood.icon className={cn("h-8 w-8", mood.color)} />
              <span className="text-sm">{mood.name}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full bg-transparent border-none shadow-none flex flex-col items-center justify-center text-center p-4">
      <CardHeader>
        <Target className="h-12 w-12 mx-auto text-primary" />
        <CardTitle className="text-2xl font-bold mt-4">
          {getGreeting()}, {userName}!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {primaryGoal ? (
          <>
            <CardDescription className="text-lg">
              Today’s main goal is <span className="font-semibold text-foreground">{primaryGoal.title}</span>.
            </CardDescription>
            <p className="text-muted-foreground">
              {getMotivationalText()} Remember to break it down into bite-size tasks.
            </p>
            <p className="font-semibold text-lg">Ready?</p>
            <Button onClick={handleStartFocus} size="lg">
              Start Focus Session
            </Button>
          </>
        ) : (
          <>
            <CardDescription className="text-lg">
              You have no active goals. Set a goal to get started!
            </CardDescription>
            <p className="text-muted-foreground">
              Define what you want to achieve to start your personalized focus session.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}