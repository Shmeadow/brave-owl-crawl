"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface GoalData {
  id: string;
  user_id?: string; // Optional for local storage goals
  title: string;
  completed: boolean;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_goals';

export function useGoals() {
  const { supabase, session, loading: authLoading } = useSupabase();
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
        // console.log("User logged in. Checking for local goals to migrate..."); // Removed for cleaner logs

        // 1. Load local goals (if any)
        const localGoalsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localGoals: GoalData[] = [];
        try {
          localGoals = localGoalsString ? JSON.parse(localGoalsString) : [];
        } catch (e) {
          console.error("Error parsing local storage goals:", e);
          localGoals = [];
        }

        // 2. Fetch user's existing goals from Supabase
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

          // 3. Migrate local goals to Supabase if they don't already exist
          if (localGoals.length > 0) {
            // console.log(`Found ${localGoals.length} local goals. Attempting migration...`); // Removed for cleaner logs
            for (const localGoal of localGoals) {
              // Check if a similar goal (by title) already exists in Supabase for this user
              const existsInSupabase = mergedGoals.some(
                sg => sg.title === localGoal.title
              );

              if (!existsInSupabase) {
                const { data: newSupabaseGoal, error: insertError } = await supabase
                  .from('goals')
                  .insert({
                    user_id: session.user.id,
                    title: localGoal.title,
                    completed: localGoal.completed,
                    created_at: localGoal.created_at || new Date().toISOString(), // Ensure created_at
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error migrating local goal to Supabase:", insertError);
                  toast.error("Error migrating some local goals.");
                } else if (newSupabaseGoal) {
                  mergedGoals.push(newSupabaseGoal as GoalData);
                  // console.log("Migrated local goal:", newSupabaseGoal.title); // Removed for cleaner logs
                }
              }
            }
            // Clear local storage after migration attempt
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

  const handleAddGoal = useCallback(async (title: string) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: session.user.id,
          title: title,
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
        completed: false,
        created_at: new Date().toISOString(),
      };
      setGoals((prevGoals) => [...prevGoals, newGoal]);
      toast.success("Goal added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleToggleComplete = useCallback(async (goalId: string, currentCompleted: boolean) => {
    const goalToUpdate = goals.find(goal => goal.id === goalId);
    if (!goalToUpdate) return;

    const newCompletedStatus = !currentCompleted;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update({ completed: newCompletedStatus })
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
        goal.id === goalId ? { ...goal, completed: newCompletedStatus } : goal
      ));
      if (newCompletedStatus) {
        toast.success("🎉 Goal Complete! Great job!");
      } else {
        toast.info("Goal marked as incomplete (locally).");
      }
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
      }
    } else {
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      toast.success("Goal deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  return {
    goals,
    loading,
    isLoggedInMode,
    handleAddGoal,
    handleToggleComplete,
    handleDeleteGoal,
  };
}