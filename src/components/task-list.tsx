"use client";

import React from "react";
import { TaskItem } from "@/components/task-item";
import { TaskData } from "@/hooks/use-tasks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskListProps {
  tasks: TaskData[];
  onToggleComplete: (taskId: string, currentCompleted: boolean) => void;
  onUpdateTask: (taskId: string, updatedData: Partial<TaskData>) => void;
  onDelete: (taskId: string) => void;
  isCurrentRoomWritable: boolean;
}

export function TaskList({ tasks, onToggleComplete, onUpdateTask, onDelete, isCurrentRoomWritable }: TaskListProps) {
  return (
    <Card className="w-full flex flex-col flex-1 bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Your Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {tasks.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm text-center">No tasks added yet. Start by adding one above!</p>
        ) : (
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-3">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onUpdateTask={onUpdateTask}
                  onDelete={onDelete}
                  isCurrentRoomWritable={isCurrentRoomWritable}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}