"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useNotifications } from "./use-notifications";
import { differenceInDays, isPast, isToday } from 'date-fns';
import { useCurrentRoom } from "./use-current-room";

export interface GoalData {
  id: string;
  user_id?: string;
  room_id: string | null;
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
  const { currentRoomId } = useCurrentRoom();
  const { addNotification } = useNotifications();
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      const localGoalsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localGoals: GoalData[] = [];
      try {
        localGoals = localGoalsString ? JSON.parse(localGoalsString) : [];
      } catch (e) {
        console.error("Error parsing local storage goals:", e);
      }

      const query = supabase.from('goals').select('*');
      if (currentRoomId) {
        query.eq('room_id', currentRoomId);
      } else {
        query.is('room_id', null).eq('user_id', session.user.id);
      }
      const { data: supabaseGoals, error: fetchError } = await query.order('created_at', { ascending: true });

      if (fetchError) {
        toast.error("Error fetching goals: " + fetchError.message);
        setGoals([]);
      } else {
        let mergedGoals = [...(supabaseGoals as GoalData[])];
        if (localGoals.length > 0 && !currentRoomId) {
          for (const localGoal of localGoals) {
            const existsInSupabase = mergedGoals.some(sg => sg.title === localGoal.title && sg.created_at === localGoal.created_at);
            if (!existsInSupabase) {
              const { data: newSupabaseGoal, error: insertError } = await supabase
                .from('goals')
                .insert({
                  user_id: session.user.id,
                  room_id: null,
                  title: localGoal.title,
                  description: localGoal.description,
                  target_completion_date: localGoal.target_completion_date,
                  completed: localGoal.completed,
                  created_at: localGoal.created_at || new Date().toISOString(),
                  completed_at: localGoal.completed_at || null,
                })
                .select()
                .single();
              if (insertError) {
                console.error("Error migrating local goal:", insertError);
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
      setIsLoggedInMode(false);
      const storedGoalsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedGoals: GoalData[] = [];
      try {
        loadedGoals = storedGoalsString ? JSON.parse(storedGoalsString) : [];
      } catch (e) {
        console.error("Error parsing local storage goals:", e);
      }
      setGoals(loadedGoals);
    }
    setLoading(false);
  }, [session, supabase, authLoading, currentRoomId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoggedInMode, loading]);

  useEffect(() => {
    if (loading || goals.length === 0) return;
    const checkAndNotifyGoals = () => {
      const now = new Date();
      goals.forEach(goal => {
        if (goal.completed || !goal.target_completion_date) return;
        const targetDate = new Date(goal.target_completion_date);
        const createdDate = new Date(goal.created_at);
        if (isPast(targetDate) && !isToday(targetDate)) return;
        const totalDurationDays = differenceInDays(targetDate, createdDate);
        const daysRemaining = differenceInDays(targetDate, now);
        const lastNotified = localStorage.getItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goal.id}`);
        const lastNotifiedDate = lastNotified ? new Date(lastNotified) : null;
        if (lastNotifiedDate && differenceInDays(now, lastNotifiedDate) === 0) return;
        let notificationMessage: string | null = null;
        if (daysRemaining <= 0 && isToday(targetDate)) {
          notificationMessage = `🚨 Deadline Today! Your goal "${goal.title}" is due today.`;
        } else if (daysRemaining > 0 && daysRemaining <= 3) {
          notificationMessage = `⏳ Critical: Your goal "${goal.title}" is due in ${daysRemaining} day(s)!`;
        } else if (totalDurationDays > 0 && daysRemaining > 3) {
          const progressRatio = (totalDurationDays - daysRemaining) / totalDurationDays;
          if (progressRatio >= 0.5 && progressRatio < 0.75) {
            notificationMessage = `🎯 Mid-point check: You're halfway to completing "${goal.title}"!`;
          }
        }
        if (notificationMessage) {
          addNotification(notificationMessage);
          localStorage.setItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goal.id}`, now.toISOString());
        }
      });
    };
    checkAndNotifyGoals();
    const interval = setInterval(checkAndNotifyGoals, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [goals, loading, addNotification]);

  useEffect(() => {
    if (!currentRoomId || !supabase) return;
    const channel = supabase.channel(`room-goals-${currentRoomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `room_id=eq.${currentRoomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGoals(prev => [...prev, payload.new as GoalData]);
          } else if (payload.eventType === 'UPDATE') {
            setGoals(prev => prev.map(g => g.id === (payload.new as GoalData).id ? payload.new as GoalData : g));
          } else if (payload.eventType === 'DELETE') {
            setGoals(prev => prev.filter(g => g.id !== (payload.old as any).id));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRoomId, supabase]);

  const handleAddGoal = useCallback(async (title: string, description: string | null, targetCompletionDate: string | null) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: session.user.id,
          room_id: currentRoomId,
          title: title,
          description: description,
          target_completion_date: targetCompletionDate,
          completed: false,
        });
      if (error) {
        toast.error("Error adding goal: " + error.message);
      } else {
        toast.success("Goal added successfully!");
      }
    } else {
      if (currentRoomId) {
        toast.error("You must be logged in to add goals to a room.");
        return;
      }
      const newGoal: GoalData = {
        id: crypto.randomUUID(),
        room_id: null,
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
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const handleToggleComplete = useCallback(async (goalId: string, currentCompleted: boolean) => {
    const newCompletedStatus = !currentCompleted;
    const newCompletedAt = newCompletedStatus ? new Date().toISOString() : null;
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('goals')
        .update({ completed: newCompletedStatus, completed_at: newCompletedAt })
        .eq('id', goalId);
      if (error) {
        toast.error("Error updating goal status: " + error.message);
      } else {
        toast.info(newCompletedStatus ? "🎉 Goal Complete! Great job!" : "Goal marked as incomplete.");
      }
    } else {
      setGoals(prevGoals => prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, completed: newCompletedStatus, completed_at: newCompletedAt } : goal
      ));
      toast.info(newCompletedStatus ? "🎉 Goal Complete! Great job!" : "Goal marked as incomplete (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleUpdateGoal = useCallback(async (goalId: string, updatedData: Partial<Omit<GoalData, 'id' | 'user_id' | 'created_at' | 'completed_at' | 'room_id'>>) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('goals')
        .update(updatedData)
        .eq('id', goalId);
      if (error) {
        toast.error("Error updating goal: " + error.message);
      } else {
        toast.success("Goal updated successfully!");
      }
    } else {
      setGoals(prevGoals => prevGoals.map(goal =>
        goal.id === goalId ? { ...goal, ...updatedData } : goal
      ));
      toast.success("Goal updated (locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
      if (error) {
        toast.error("Error deleting goal: " + error.message);
      } else {
        toast.success("Goal deleted.");
        localStorage.removeItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goalId}`);
      }
    } else {
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      toast.success("Goal deleted (locally).");
      localStorage.removeItem(`${LOCAL_STORAGE_NOTIFICATION_KEY_PREFIX}${goalId}`);
    }
  }, [isLoggedInMode, session, supabase]);

  return {
    goals,
    loading,
    isLoggedInMode,
    handleAddGoal,
    handleToggleComplete,
    handleUpdateGoal,
    handleDeleteGoal,
  };
}