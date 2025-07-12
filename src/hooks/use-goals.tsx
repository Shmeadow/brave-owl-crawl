"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useNotifications } from "./use-notifications";
import { differenceInDays, isPast, isToday } from 'date-fns';

export interface GoalData {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  target_completion_date: string | null;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

const LOCAL_STORAGE_KEY = 'guest_goals';
const LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX = 'goal_notification_';

export function useGoals() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { addNotification } = useNotifications();
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (session) {
        setIsLoggedInMode(true);
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setGoals(data as GoalData[]);
      } else {
        setIsLoggedInMode(false);
        const storedGoals = localStorage.getItem(LOCAL_STORAGE_KEY);
        setGoals(storedGoals ? JSON.parse(storedGoals) : []);
      }
    } catch (error: any) {
      toast.error("Failed to load goals: " + error.message);
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    if (!authLoading) {
      fetchGoals();
    }
  }, [authLoading, fetchGoals]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoggedInMode, loading]);

  useEffect(() => {
    if (loading || goals.length === 0) return;
    const now = new Date();
    goals.forEach(goal => {
      if (goal.completed || !goal.target_completion_date) return;
      const targetDate = new Date(goal.target_completion_date);
      if (isPast(targetDate) && !isToday(targetDate)) return;
      const daysRemaining = differenceInDays(targetDate, now);
      const lastNotified = localStorage.getItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goal.id}`);
      if (lastNotified && differenceInDays(now, new Date(lastNotified)) === 0) return;
      let message: string | null = null;
      if (daysRemaining <= 0) message = `🚨 Deadline Today! Your goal "${goal.title}" is due today.`;
      else if (daysRemaining <= 3) message = `⏳ Critical: Your goal "${goal.title}" is due in ${daysRemaining} day(s)!`;
      if (message) {
        addNotification(message);
        localStorage.setItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goal.id}`, now.toISOString());
      }
    });
  }, [goals, loading, addNotification]);

  const handleAddGoal = useCallback(async (title: string, description: string | null, targetCompletionDate: string | null) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .insert({ user_id: session.user.id, title, description, target_completion_date: targetCompletionDate, completed: false })
        .select()
        .single();
      if (error) toast.error("Error adding goal: " + error.message);
      else if (data) setGoals(prev => [...prev, data as GoalData]);
    } else {
      const newGoal: GoalData = { id: crypto.randomUUID(), title, description, target_completion_date: targetCompletionDate, completed: false, created_at: new Date().toISOString(), completed_at: null };
      setGoals(prev => [...prev, newGoal]);
    }
  }, [isLoggedInMode, session, supabase]);

  const handleToggleComplete = useCallback(async (goalId: string, currentCompleted: boolean) => {
    const newCompletedStatus = !currentCompleted;
    const newCompletedAt = newCompletedStatus ? new Date().toISOString() : null;
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update({ completed: newCompletedStatus, completed_at: newCompletedAt })
        .eq('id', goalId)
        .select()
        .single();
      if (error) toast.error("Error updating goal: " + error.message);
      else if (data) setGoals(prev => prev.map(g => g.id === goalId ? data as GoalData : g));
    } else {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, completed: newCompletedStatus, completed_at: newCompletedAt } : g));
    }
  }, [goals, isLoggedInMode, session, supabase]);

  const handleUpdateGoal = useCallback(async (goalId: string, updatedData: Partial<GoalData>) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('goals').update(updatedData).eq('id', goalId).select().single();
      if (error) toast.error("Error updating goal: " + error.message);
      else if (data) setGoals(prev => prev.map(g => g.id === goalId ? data as GoalData : g));
    } else {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updatedData } : g));
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) toast.error("Error deleting goal: " + error.message);
      else setGoals(prev => prev.filter(g => g.id !== goalId));
    } else {
      setGoals(prev => prev.filter(g => g.id !== goalId));
    }
  }, [isLoggedInMode, session, supabase]);

  return { goals, loading, isLoggedInMode, handleAddGoal, handleToggleComplete, handleUpdateGoal, handleDeleteGoal };
}