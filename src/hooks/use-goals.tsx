"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useNotifications } from "./use-notifications"; // Import useNotifications
import { differenceInDays, isPast, isToday } from 'date-fns'; // Import date-fns utilities

export interface GoalData {
  id: string;
  user_id?: string; // Optional for local storage goals
  title: string;
  description: string | null; // New field
  target_completion_date: string | null; // New field (YYYY-MM-DD)
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

const LOCAL_STORAGE_KEY = 'guest_goals';
const LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX = 'goal_notification_'; // For per-goal notifications

export function useGoals() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { addNotification } = useNotifications(); // Use the notification hook
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadGoals = async () => {
      setLoading(true);
      if (session && supabase) {
        // User is logged in
        setIsLoggedInMode(true);
        const localGoalsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localGoals: GoalData[] = [];
        try {
          localGoals = localGoalsString ? JSON.parse(localGoalsString) : [];
        } catch (e) {
          console.error("Error parsing local storage goals:", e);
          localGoals = [];
        }

        const { data: supabaseGoals, error: fetchError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (fetchError) {
          toast.error("Error fetching goals from Supabase: " + fetchError.message);
          console.error("Error fetching goals (Supabase):", fetchError);
          setGoals([]);
        } else {
          let mergedGoals = [...(supabaseGoals as GoalData[])];

          if (localGoals.length > 0) {
            for (const localGoal of localGoals) {
              const existsInSupabase = mergedGoals.some(
                sg => sg.title === localGoal.title && sg.created_at === localGoal.created_at
              );

              if (!existsInSupabase) {
                const { data: newSupabaseGoal, error: insertError } = await supabase
                  .from('goals')
                  .insert({
                    user_id: session.user.id,
                    title: localGoal.title,
                    description: localGoal.description, // Include new field
                    target_completion_date: localGoal.target_completion_date, // Include new field
                    completed: localGoal.completed,
                    created_at: localGoal.created_at || new Date().toISOString(),
                    completed_at: localGoal.completed_at || null,
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error migrating local goal to Supabase:", insertError);
                  toast.error("Error migrating some local goals.");
                } else if (newSupabaseGoal) {
                  mergedGoals.push(newSupabaseGoal as GoalData);
                }
              }
            }
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            toast.success("Local goals migrated to your account!");
          }
          setGoals(mergedGoals);
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const storedGoalsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let loadedGoals: GoalData[] = [];
        try {
          loadedGoals = storedGoalsString ? JSON.parse(storedGoalsString) : [];
        } catch (e) {
          console.error("Error parsing local storage goals:", e);
          loadedGoals = [];
        }
        setGoals(loadedGoals);
        if (loadedGoals.length === 0) {
          toast.info("You are browsing goals as a guest. Your goals will be saved locally.");
        }
      }
      setLoading(false);
    };

    loadGoals();
  }, [session, supabase, authLoading]);

  // Effect to save goals to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoggedInMode, loading]);

  // Goal Reminder Notification Logic
  useEffect(() => {
    if (loading || goals.length === 0) return;

    const checkAndNotifyGoals = () => {
      const now = new Date();
      goals.forEach(goal => {
        if (goal.completed || !goal.target_completion_date) return;

        const targetDate = new Date(goal.target_completion_date);
        const createdDate = new Date(goal.created_at);

        // Only notify if target date is in the future or today
        if (isPast(targetDate) && !isToday(targetDate)) return;

        const totalDurationDays = differenceInDays(targetDate, createdDate);
        const daysRemaining = differenceInDays(targetDate, now);

        const lastNotified = localStorage.getItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goal.id}`);
        const lastNotifiedDate = lastNotified ? new Date(lastNotified) : null;

        // Prevent multiple notifications within 24 hours for the same goal
        if (lastNotifiedDate && differenceInDays(now, lastNotifiedDate) === 0) {
          return;
        }

        let notificationMessage: string | null = null;

        if (daysRemaining <= 0 && isToday(targetDate)) {
          notificationMessage = `🚨 Deadline Today! Your goal "${goal.title}" is due today.`;
        } else if (daysRemaining > 0 && daysRemaining <= 3) {
          notificationMessage = `⏳ Critical: Your goal "${goal.title}" is due in ${daysRemaining} day(s)!`;
        } else if (totalDurationDays > 0 && daysRemaining > 3) {
          const progressRatio = (totalDurationDays - daysRemaining) / totalDurationDays;
          if (progressRatio >= 0.5 && progressRatio < 0.75) { // Mid-point (50-75% elapsed)
            notificationMessage = `🎯 Mid-point check: You're halfway to completing "${goal.title}"!`;
          }
        }

        if (notificationMessage) {
          addNotification(notificationMessage);
          localStorage.setItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goal.id}`, now.toISOString());
        }
      });
    };

    // Run once on load and then every hour
    checkAndNotifyGoals();
    const interval = setInterval(checkAndNotifyGoals, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [goals, loading, addNotification]);


  const handleAddGoal = useCallback(async (title: string, description: string | null, targetCompletionDate: string | null) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: session.user.id,
          title: title,
          description: description,
          target_completion_date: targetCompletionDate,
          completed: false,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding goal (Supabase): " + error.message);
        console.error("Error adding goal (Supabase):", error);
      } else if (data) {
        setGoals((prevGoals) => [...prevGoals, data as GoalData]);
        toast.success("Goal added successfully to your account!");
      }
    } else {
      const newGoal: GoalData = {
        id: crypto.randomUUID(),
        title: title,
        description: description,
        target_completion_date: targetCompletionDate,
        completed: false,
        created_at: new Date().toISOString(),
        completed_at: null,
      };
      setGoals((prevGoals) => [...prevGoals, newGoal]);
      toast.success("Goal added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleToggleComplete = useCallback(async (goalId: string, currentCompleted: boolean) => {
    const goalToUpdate = goals.find(goal => goal.id === goalId);
    if (!goalToUpdate) return;

    const newCompletedStatus = !currentCompleted;
    const newCompletedAt = newCompletedStatus ? new Date().toISOString() : null;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update({ completed: newCompletedStatus, completed_at: newCompletedAt })
        .eq('id', goalId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating goal status (Supabase): " + error.message);
        console.error("Error updating goal status (Supabase):", error);
      } else if (data) {
        setGoals(prevGoals => prevGoals.map(goal => goal.id === goalId ? data as GoalData : goal));
        if (newCompletedStatus) {
          toast.success("🎉 Goal Complete! Great job!");
        } else {
          toast.info("Goal marked as incomplete.");
        }
      }
    } else {
      setGoals(prevGoals => prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, completed: newCompletedStatus, completed_at: newCompletedAt } : goal
      ));
      if (newCompletedStatus) {
        toast.success("🎉 Goal Complete! Great job!");
      } else {
        toast.info("Goal marked as incomplete (locally).");
      }
    }
  }, [goals, isLoggedInMode, session, supabase]);

  const handleUpdateGoal = useCallback(async (goalId: string, updatedData: Partial<Omit<GoalData, 'id' | 'user_id' | 'created_at' | 'completed_at'>>) => {
    const goalToUpdate = goals.find(goal => goal.id === goalId);
    if (!goalToUpdate) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update(updatedData)
        .eq('id', goalId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating goal (Supabase): " + error.message);
        console.error("Error updating goal (Supabase):", error);
      } else if (data) {
        setGoals(prevGoals => prevGoals.map(goal => goal.id === goalId ? data as GoalData : goal));
        toast.success("Goal updated successfully!");
      }
    } else {
      setGoals(prevGoals => prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, ...updatedData } : goal
      ));
      toast.success("Goal updated (locally)!");
    }
  }, [goals, isLoggedInMode, session, supabase]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error deleting goal (Supabase): " + error.message);
        console.error("Error deleting goal (Supabase):", error);
      } else {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
        toast.success("Goal deleted from your account.");
        localStorage.removeItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goalId}`); // Clear notification flag
      }
    } else {
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      toast.success("Goal deleted (locally).");
      localStorage.removeItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goalId}`); // Clear notification flag
    }
  }, [isLoggedInMode, session, supabase]);

  return {
    goals,
    loading,
    isLoggedInMode,
    handleAddGoal,
    handleToggleComplete,
    handleUpdateGoal, // Expose new update function
    handleDeleteGoal,
  };
}