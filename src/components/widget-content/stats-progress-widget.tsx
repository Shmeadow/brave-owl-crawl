"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Goal, ListTodo, BookOpen, Timer, CheckCircle, XCircle } from "lucide-react";
import { useGoals } from "@/hooks/use-goals";
import { useTasks } from "@/hooks/use-tasks";
import { useFlashcards } from "@/hooks/use-flashcards";
import { usePomodoroState } from "@/hooks/use-pomodoro-state";
import { useSupabase } from "@/integrations/supabase/auth";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface StatsProgressWidgetProps {
  isCurrentRoomWritable: boolean; // Not directly used for display, but good to pass
}

export function StatsProgressWidget({ isCurrentRoomWritable }: StatsProgressWidgetProps) {
  const { session } = useSupabase();
  const { goals, loading: goalsLoading } = useGoals();
  const { tasks, loading: tasksLoading } = useTasks();
  const { cards, loading: flashcardsLoading } = useFlashcards();
  const { customTimes, loading: pomodoroLoading } = usePomodoroState();

  const loading = goalsLoading || tasksLoading || flashcardsLoading || pomodoroLoading;

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading your stats...</p>
      </div>
    );
  }

  // Goals Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const incompleteGoals = totalGoals - completedGoals;

  // Tasks Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const incompleteTasks = totalTasks - completedTasks;

  // Flashcards Stats
  const totalFlashcards = cards.length;
  const masteredFlashcards = cards.filter(c => c.status === 'Mastered').length;
  const learningFlashcards = cards.filter(c => c.status !== 'Mastered').length;

  // Pomodoro Settings
  const focusTimeMinutes = customTimes.focus / 60;
  const shortBreakMinutes = customTimes['short-break'] / 60;
  const longBreakMinutes = customTimes['long-break'] / 60;

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Your Productivity Snapshot</h1>

        {!session && (
          <Card className="w-full bg-card backdrop-blur-xl border-white/20">
            <CardContent className="text-center text-sm text-muted-foreground p-4">
              Log in to save and track your productivity stats across sessions and devices!
            </CardContent>
          </Card>
        )}

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Goal className="h-6 w-6 text-primary" /> Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Goals</p>
              <p className="text-2xl font-bold text-foreground">{totalGoals}</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-green-100/70 dark:bg-green-900/30 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-300">Completed</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">{completedGoals}</p>
            </div>
            <div className="col-span-2 flex flex-col items-center p-3 bg-red-100/70 dark:bg-red-900/30 rounded-lg">
              <p className="text-xs text-red-800 dark:text-red-300">Incomplete</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">{incompleteGoals}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-6 w-6 text-primary" /> Task Management
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-green-100/70 dark:bg-green-900/30 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-300">Completed</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">{completedTasks}</p>
            </div>
            <div className="col-span-2 flex flex-col items-center p-3 bg-red-100/70 dark:bg-red-900/30 rounded-lg">
              <p className="text-xs text-red-800 dark:text-red-300">Incomplete</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">{incompleteTasks}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Flashcard Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Cards</p>
              <p className="text-2xl font-bold text-foreground">{totalFlashcards}</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-green-100/70 dark:bg-green-900/30 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-300">Mastered</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">{masteredFlashcards}</p>
            </div>
            <div className="col-span-2 flex flex-col items-center p-3 bg-yellow-100/70 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-300">Still Learning</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{learningFlashcards}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-6 w-6 text-primary" /> Pomodoro Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Focus</p>
              <p className="text-xl font-bold text-foreground">{focusTimeMinutes} min</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Short Break</p>
              <p className="text-xl font-bold text-foreground">{shortBreakMinutes} min</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Long Break</p>
              <p className="text-xl font-bold text-foreground">{longBreakMinutes} min</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          This dashboard provides a quick overview of your progress across different productivity tools.
        </p>
      </div>
    </div>
  );
}