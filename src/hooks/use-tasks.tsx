"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useCurrentRoom } from "./use-current-room";
import { toast } from "sonner";

export interface TaskData {
  id: string;
  user_id?: string;
  room_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_tasks';

export function useTasks() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (session) {
        setIsLoggedInMode(true);
        let query = supabase.from('tasks').select('*');

        if (currentRoomId) {
          // Fetch tasks for the specific room. RLS will handle permissions.
          query = query.eq('room_id', currentRoomId);
        } else {
          // Fetch tasks for the user's personal space (no room).
          query = query.eq('user_id', session.user.id).is('room_id', null);
        }
        
        const { data, error } = await query.order('created_at', { ascending: true });
        if (error) throw error;
        setTasks(data as TaskData[]);
      } else {
        setIsLoggedInMode(false);
        const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
        setTasks(storedTasks ? JSON.parse(storedTasks) : []);
      }
    } catch (error: any) {
      toast.error("Failed to load tasks: " + error.message);
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [session, supabase, currentRoomId]);

  useEffect(() => {
    if (!authLoading) {
      fetchTasks();
    }
  }, [authLoading, fetchTasks]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoggedInMode, loading]);

  const handleAddTask = useCallback(async (title: string, description: string | null, dueDate: string | null) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: session.user.id, room_id: currentRoomId, title, description, due_date: dueDate, completed: false })
        .select()
        .single();
      if (error) toast.error("Error adding task: " + error.message);
      else if (data) setTasks(prev => [...prev, data as TaskData]);
    } else {
      const newTask: TaskData = { id: crypto.randomUUID(), room_id: null, title, description, due_date: dueDate, completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setTasks(prev => [...prev, newTask]);
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const handleToggleComplete = useCallback(async (taskId: string, currentCompleted: boolean) => {
    const newCompletedStatus = !currentCompleted;
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('tasks').update({ completed: newCompletedStatus }).eq('id', taskId);
      if (error) toast.error("Error updating task: " + error.message);
      else setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompletedStatus } : t));
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompletedStatus } : t));
    }
  }, [isLoggedInMode, session, supabase]);

  const handleUpdateTask = useCallback(async (taskId: string, updatedData: Partial<TaskData>) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('tasks').update(updatedData).eq('id', taskId).select().single();
      if (error) toast.error("Error updating task: " + error.message);
      else if (data) setTasks(prev => prev.map(t => t.id === taskId ? data as TaskData : t));
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedData, updated_at: new Date().toISOString() } : t));
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) toast.error("Error deleting task: " + error.message);
      else setTasks(prev => prev.filter(t => t.id !== taskId));
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  }, [isLoggedInMode, session, supabase]);

  return { tasks, loading, isLoggedInMode, handleAddTask, handleToggleComplete, handleUpdateTask, handleDeleteTask };
}