"use client";

import React from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { useGoals } from '@/hooks/use-goals';
import { useWidget } from '@/components/widget/widget-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Target } from 'lucide-react';

export function PersonalizedKickoff() {
  const { profile, loading: authLoading } = useSupabase();
  const { goals, loading: goalsLoading } = useGoals();
  const { toggleWidget } = useWidget();

  const loading = authLoading || goalsLoading;

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Good afternoon";
    return "Good evening";
  };

  const primaryGoal = goals.find(goal => !goal.completed);
  const userName = profile?.first_name || 'there';

  const handleStartFocus = () => {
    // This will open the Pomodoro widget if it's closed, or bring it to the front.
    toggleWidget('timer', 'Timer'); 
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
              Remember to break it down into bite-size tasks. This is prime time for clarity. Let's dive in and turn ideas into structure.
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