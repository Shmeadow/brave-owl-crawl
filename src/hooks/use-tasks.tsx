"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useCurrentRoom } from "./use-current-room";
import { toast } from "sonner";

export interface TaskData {
  id: string;
  user_id?: string; // Optional for local storage tasks
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
    if (authLoading) return;

    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      // 1. Load local tasks (if any) for migration
      const localTasksString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localTasks: TaskData[] = [];
      try {
        localTasks = localTasksString ? JSON.parse(localTasksString) : [];
      } catch (e) {
        console.error("Error parsing local storage tasks:", e);
        localTasks = [];
      }

      // 2. Fetch user's existing tasks from Supabase
      const { data: supabaseTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        toast.error("Error fetching tasks from Supabase: " + fetchError.message);
        console.error("Error fetching tasks (Supabase):", fetchError);
        setTasks([]);
      } else {
        let mergedTasks = [...(supabaseTasks as TaskData[])];

        // 3. Migrate local tasks to Supabase if they don't already exist
        if (localTasks.length > 0) {
          for (const localTask of localTasks) {
            const existsInSupabase = mergedTasks.some(
              st => st.title === localTask.title && st.created_at === localTask.created_at
            );

            if (!existsInSupabase) {
              const { data: newSupabaseTask, error: insertError } = await supabase
                .from('tasks')
                .insert({
                  user_id: session.user.id,
                  room_id: null, // Local tasks are personal, not room-specific
                  title: localTask.title,
                  description: localTask.description,
                  due_date: localTask.due_date,
                  completed: localTask.completed,
                  created_at: localTask.created_at || new Date().toISOString(),
                })
                .select()
                .single();

              if (insertError) {
                console.error("Error migrating local task to Supabase:", insertError);
                toast.error("Error migrating some local tasks.");
              } else if (newSupabaseTask) {
                mergedTasks.push(newSupabaseTask as TaskData);
              }
            }
          }
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          toast.success("Local tasks migrated to your account!");
        }
        setTasks(mergedTasks);
      }
    } else {
      // User is a guest (not logged in)
      setIsLoggedInMode(false);
      const storedTasksString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedTasks: TaskData[] = [];
      try {
        loadedTasks = storedTasksString ? JSON.parse(storedTasksString) : [];
      } catch (e) {
        console.error("Error parsing local storage tasks:", e);
        loadedTasks = [];
      }
      setTasks(loadedTasks);
      if (loadedTasks.length === 0) {
        toast.info("You are browsing tasks as a guest. Your tasks will be saved locally.");
      }
    }
    setLoading(false);
  }, [session, supabase, authLoading]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Effect to save tasks to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoggedInMode, loading]);

  const handleAddTask = useCallback(async (title: string, description: string | null, dueDate: string | null) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: session.user.id,
          room_id: currentRoomId, // Link to current room if available
          title: title,
          description: description,
          due_date: dueDate,
          completed: false,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding task (Supabase): " + error.message);
        console.error("Error adding task (Supabase):", error);
      } else if (data) {
        setTasks((prevTasks) => [...prevTasks, data as TaskData]);
        toast.success("Task added successfully to your account!");
      }
    } else {
      const newTask: TaskData = {
        id: crypto.randomUUID(),
        room_id: null, // Guest tasks are always personal
        title: title,
        description: description,
        due_date: dueDate,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTasks((prevTasks) => [...prevTasks, newTask]);
      toast.success("Task added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const handleToggleComplete = useCallback(async (taskId: string, currentCompleted: boolean) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    const newCompletedStatus = !currentCompleted;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: newCompletedStatus })
        .eq('id', taskId)
        .eq('user_id', session.user.id); // Ensure user owns the task

      if (error) {
        toast.error("Error updating task status (Supabase): " + error.message);
        console.error("Error updating task status (Supabase):", error);
      } else {
        setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, completed: newCompletedStatus, updated_at: new Date().toISOString() } : task));
        toast.info(newCompletedStatus ? "Task marked as complete!" : "Task marked as incomplete.");
      }
    } else {
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: newCompletedStatus, updated_at: new Date().toISOString() } : task
      ));
      toast.info(newCompletedStatus ? "Task marked as complete (locally)!" : "Task marked as incomplete (locally).");
    }
  }, [tasks, isLoggedInMode, session, supabase]);

  const handleUpdateTask = useCallback(async (taskId: string, updatedData: Partial<Omit<TaskData, 'id' | 'user_id' | 'room_id' | 'created_at' | 'updated_at'>>) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .update(updatedData)
        .eq('id', taskId)
        .eq('user_id', session.user.id) // Ensure user owns the task
        .select()
        .single();

      if (error) {
        toast.error("Error updating task (Supabase): " + error.message);
        console.error("Error updating task (Supabase):", error);
      } else if (data) {
        setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? data as TaskData : task));
        toast.success("Task updated successfully!");
      }
    } else {
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedData, updated_at: new Date().toISOString() } : task
      ));
      toast.success("Task updated (locally)!");
    }
  }, [tasks, isLoggedInMode, session, supabase]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', session.user.id); // Ensure user owns the task

      if (error) {
        toast.error("Error deleting task (Supabase): " + error.message);
        console.error("Error deleting task (Supabase):", error);
      } else {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        toast.success("Task deleted from your account.");
      }
    } else {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast.success("Task deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  return {
    tasks,
    loading,
    isLoggedInMode,
    handleAddTask,
    handleToggleComplete,
    handleUpdateTask,
    handleDeleteTask,
  };
}