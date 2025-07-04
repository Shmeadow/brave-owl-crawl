"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "./use-current-room"; // Import useCurrentRoom

export interface GoalData {
  id: string;
  user_id: string; // Now always present for Supabase, or local for guest
  room_id: string | null; // New: Can be null for personal goals
  title: string;
  completed: boolean;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_goals';

export function useGoals() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId, currentRoomCreatorId } = useCurrentRoom(); // Get current room ID and creator
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadGoals = async () => {
      setLoading(true);
      console.log(`useGoals: Loading goals for room ID: ${currentRoomId || 'personal space'}`);
      if (session && supabase) {
        setIsLoggedInMode(true);
        
        let fetchedGoals: GoalData[] = [];
        if (currentRoomId) {
          // Fetch goals for the current room
          const { data: roomGoals, error: fetchError } = await supabase
            .from('goals')
            .select('*')
            .eq('room_id', currentRoomId)
            .order('created_at', { ascending: true });

          if (fetchError) {
            toast.error("Error fetching goals for room: " + fetchError.message);
            console.error("Error fetching goals (Supabase, room):", fetchError);
          } else {
            fetchedGoals = roomGoals as GoalData[];
          }
        } else {
          // Fetch personal goals (room_id is NULL)
          const { data: personalGoals, error: fetchError } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', session.user.id)
            .is('room_id', null)
            .order('created_at', { ascending: true });

          if (fetchError) {
            toast.error("Error fetching personal goals: " + fetchError.message);
            console.error("Error fetching goals (Supabase, personal):", fetchError);
          } else {
            fetchedGoals = personalGoals as GoalData[];
          }

          // Attempt to migrate local goals to personal goals if they exist
          const localGoalsString = localStorage.getItem(LOCAL_STORAGE_KEY);
          let localGoals: GoalData[] = [];
          try {
            localGoals = localGoalsString ? JSON.parse(localGoalsString) : [];
          } catch (e) {
            console.error("Error parsing local storage goals:", e);
            localGoals = [];
          }

          if (localGoals.length > 0) {
            console.log(`Found ${localGoals.length} local goals. Attempting migration...`);
            const toInsert = localGoals.filter(localGoal => 
              !fetchedGoals.some(sg => sg.title === localGoal.title) // Avoid duplicates
            ).map(localGoal => ({
              user_id: session.user.id,
              room_id: null, // Migrate as personal goals
              title: localGoal.title,
              completed: localGoal.completed,
              created_at: localGoal.created_at || new Date().toISOString(),
            }));

            if (toInsert.length > 0) {
              const { data: newSupabaseGoals, error: insertError } = await supabase
                .from('goals')
                .insert(toInsert)
                .select();

              if (insertError) {
                console.error("Error migrating local goals to Supabase:", insertError);
                toast.error("Error migrating some local goals.");
              } else if (newSupabaseGoals) {
                fetchedGoals = [...fetchedGoals, ...newSupabaseGoals as GoalData[]];
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                toast.success("Local goals migrated to your account!");
              }
            } else {
              localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear if all already exist
            }
          }
        }
        setGoals(fetchedGoals);
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
  }, [session, supabase, authLoading, currentRoomId]); // Depend on currentRoomId

  // Effect to save goals to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoggedInMode, loading]);

  const handleAddGoal = useCallback(async (title: string) => {
    if (!session?.user?.id && isLoggedInMode) { // Should not happen if isLoggedInMode is true
      toast.error("You must be logged in to add a goal.");
      return;
    }

    if (isLoggedInMode && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: session!.user.id, // User ID is guaranteed if isLoggedInMode
          room_id: currentRoomId, // Use current room ID
          title: title,
          completed: false,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding goal: " + error.message);
        console.error("Error adding goal (Supabase):", error);
      } else if (data) {
        setGoals((prevGoals) => [...prevGoals, data as GoalData]);
        toast.success("Goal added successfully!");
      }
    } else {
      const newGoal: GoalData = {
        id: crypto.randomUUID(),
        user_id: 'guest', // Placeholder for guest mode
        room_id: null,
        title: title,
        completed: false,
        created_at: new Date().toISOString(),
      };
      setGoals((prevGoals) => [...prevGoals, newGoal]);
      toast.success("Goal added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const handleToggleComplete = useCallback(async (goalId: string, currentCompleted: boolean) => {
    const goalToUpdate = goals.find(goal => goal.id === goalId);
    if (!goalToUpdate) return;

    const newCompletedStatus = !currentCompleted;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update({ completed: newCompletedStatus })
        .eq('id', goalId)
        .eq('user_id', session.user.id) // Ensure user owns the goal
        .select()
        .single();

      if (error) {
        toast.error("Error updating goal status: " + error.message);
        console.error("Error updating goal status (Supabase):", error);
      } else if (data) {
        setGoals(prevGoals => prevGoals.map(goal => goal.id === goalId ? data as GoalData : goal));
        toast.info(newCompletedStatus ? "Goal marked as complete!" : "Goal marked as incomplete.");
      }
    } else {
      setGoals(prevGoals => prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, completed: newCompletedStatus } : goal
      ));
      toast.info(newCompletedStatus ? "Goal marked as complete (locally)!" : "Goal marked as incomplete (locally).");
    }
  }, [goals, isLoggedInMode, session, supabase]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', session.user.id); // Ensure user owns the goal

      if (error) {
        toast.error("Error deleting goal: " + error.message);
        console.error("Error deleting goal (Supabase):", error);
      } else {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
        toast.success("Goal deleted.");
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