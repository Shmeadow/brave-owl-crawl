"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTaskForm } from "@/components/add-task-form";
import { TaskList } from "@/components/task-list";
import { useTasks } from "@/hooks/use-tasks";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { Loader2 } from "lucide-react";

interface TasksWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function TasksWidget({ isCurrentRoomWritable }: TasksWidgetProps) {
  const { tasks, loading, isLoggedInMode, handleAddTask, handleToggleComplete, handleUpdateTask, handleDeleteTask } = useTasks();

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-2 sm:py-4">
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle>Add New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <AddTaskForm onAddTask={handleAddTask} isCurrentRoomWritable={isCurrentRoomWritable} />
          </CardContent>
        </Card>

        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onUpdateTask={handleUpdateTask}
          onDelete={handleDeleteTask}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />

        {!isLoggedInMode && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            You are currently browsing as a guest. Your tasks are saved locally in your browser. Log in to save them to your account!
          </p>
        )}
      </div>
    </div>
  );
}