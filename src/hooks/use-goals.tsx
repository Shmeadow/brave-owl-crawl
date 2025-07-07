"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { usePersistentData } from "./use-persistent-data"; // Import the new hook

export interface GoalData {
  id: string;
  user_id?: string; // Optional for local storage goals
  title: string;
  completed: boolean;
  created_at: string;
}

interface DbGoal {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_goals';
const SUPABASE_TABLE_NAME = 'goals';

export function useGoals() {
  const { supabase, session } = useSupabase();

  const {
    data: goals,
    loading,
    isLoggedInMode,
    setData: setGoals,
    fetchData,
  } = usePersistentData<GoalData[], DbGoal>({ // T_APP_DATA is GoalData[], T_DB_DATA_ITEM is DbGoal
    localStorageKey: LOCAL_STORAGE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: [],
    selectQuery: '*',
    transformFromDb: (dbGoals: DbGoal[]) => dbGoals.map(goal => ({
      id: goal.id,
      user_id: goal.user_id,
      title: goal.title,
      completed: goal.completed,
      created_at: goal.created_at,
    })),
    transformToDb: (appGoal: GoalData, userId: string) => ({ // appItem is GoalData, returns DbGoal
      id: appGoal.id,
      user_id: userId,
      title: appGoal.title,
      completed: appGoal.completed,
      created_at: appGoal.created_at,
    }),
    userIdColumn: 'user_id',
    onConflictColumn: 'id',
    debounceDelay: 0,
  });

  const handleAddGoal = useCallback(async (title: string) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
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
        fetchData();
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
  }, [isLoggedInMode, session, supabase, setGoals, fetchData]);

  const handleToggleComplete = useCallback(async (goalId: string, currentCompleted: boolean) => {
    const goalToUpdate = goals.find(goal => goal.id === goalId);
    if (!goalToUpdate) return;

    const newCompletedStatus = !currentCompleted;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .update({ completed: newCompletedStatus })
        .eq('id', goalId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating goal status (Supabase): " + error.message);
        console.error("Error updating goal status (Supabase):", error);
      } else if (data) {
        fetchData();
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
  }, [goals, isLoggedInMode, session, supabase, setGoals, fetchData]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .delete()
        .eq('id', goalId)
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error deleting goal (Supabase): " + error.message);
        console.error("Error deleting goal (Supabase):", error);
      } else {
        fetchData();
        toast.success("Goal deleted from your account.");
      }
    } else {
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      toast.success("Goal deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase, setGoals, fetchData]);

  return {
    goals,
    loading,
    isLoggedInMode,
    handleAddGoal,
    handleToggleComplete,
    handleDeleteGoal,
  };
}