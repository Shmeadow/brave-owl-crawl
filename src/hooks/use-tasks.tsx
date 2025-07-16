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
      const localTasksString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localTasks: TaskData[] = [];
      try {
        localTasks = localTasksString ? JSON.parse(localTasksString) : [];
      } catch (e) {
        console.error("Error parsing local storage tasks:", e);
        localTasks = [];
      }

      const query = supabase.from('tasks').select('*');
      if (currentRoomId) {
        query.eq('room_id', currentRoomId);
      } else {
        query.is('room_id', null).eq('user_id', session.user.id);
      }
      
      const { data: supabaseTasks, error: fetchError } = await query.order('created_at', { ascending: true });

      if (fetchError) {
        toast.error("Error fetching tasks from Supabase: " + fetchError.message);
        console.error("Error fetching tasks (Supabase):", fetchError);
        setTasks([]);
      } else {
        let mergedTasks = [...(supabaseTasks as TaskData[])];

        if (localTasks.length > 0 && !currentRoomId) { // Only migrate local tasks when in personal dashboard
          for (const localTask of localTasks) {
            const existsInSupabase = mergedTasks.some(
              st => st.title === localTask.title && st.created_at === localTask.created_at
            );

            if (!existsInSupabase) {
              const { data: newSupabaseTask, error: insertError } = await supabase
                .from('tasks')
                .insert({
                  user_id: session.user.id,
                  room_id: null,
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
      if (loadedTasks.length === 0 && !currentRoomId) {
        toast.info("You are browsing tasks as a guest. Your tasks will be saved locally.");
      }
    }
    setLoading(false);
  }, [session, supabase, authLoading, currentRoomId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoggedInMode, loading]);

  useEffect(() => {
    if (!currentRoomId || !supabase) return;
    const channel = supabase.channel(`room-tasks-${currentRoomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `room_id=eq.${currentRoomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as TaskData]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === (payload.new as TaskData).id ? payload.new as TaskData : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== (payload.old as any).id));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRoomId, supabase]);

  const handleAddTask = useCallback(async (title: string, description: string | null, dueDate: string | null) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: session.user.id,
          room_id: currentRoomId,
          title: title,
          description: description,
          due_date: dueDate,
          completed: false,
        });

      if (error) {
        toast.error("Error adding task (Supabase): " + error.message);
      } else {
        toast.success("Task added successfully!");
      }
    } else {
      if (currentRoomId) {
        toast.error("You must be logged in to add tasks to a room.");
        return;
      }
      const newTask: TaskData = {
        id: crypto.randomUUID(),
        room_id: null,
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
    const newCompletedStatus = !currentCompleted;
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: newCompletedStatus })
        .eq('id', taskId);

      if (error) {
        toast.error("Error updating task status (Supabase): " + error.message);
      } else {
        toast.info(newCompletedStatus ? "Task marked as complete!" : "Task marked as incomplete.");
      }
    } else {
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: newCompletedStatus, updated_at: new Date().toISOString() } : task
      ));
      toast.info(newCompletedStatus ? "Task marked as complete (locally)!" : "Task marked as incomplete (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleUpdateTask = useCallback(async (taskId: string, updatedData: Partial<Omit<TaskData, 'id' | 'user_id' | 'room_id' | 'created_at' | 'updated_at'>>) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('tasks')
        .update(updatedData)
        .eq('id', taskId);

      if (error) {
        toast.error("Error updating task (Supabase): " + error.message);
      } else {
        toast.success("Task updated successfully!");
      }
    } else {
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedData, updated_at: new Date().toISOString() } : task
      ));
      toast.success("Task updated (locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        toast.error("Error deleting task (Supabase): " + error.message);
      } else {
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