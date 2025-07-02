"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { GoalData } from "@/hooks/use-goals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GoalItemProps {
  goal: GoalData;
  onToggleComplete: (goalId: string, currentCompleted: boolean) => void;
  onDelete: (goalId: string) => void;
  isCurrentRoomWritable: boolean;
}

export function GoalItem({ goal, onToggleComplete, onDelete, isCurrentRoomWritable }: GoalItemProps) {
  const handleToggleComplete = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to update goals in this room.");
      return;
    }
    onToggleComplete(goal.id, goal.completed);
  };

  const handleDelete = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete goals in this room.");
      return;
    }
    onDelete(goal.id);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg shadow-sm transition-all duration-200",
        "bg-muted backdrop-blur-xl border border-border",
        goal.completed ? "opacity-70" : ""
      )}
    >
      <div className="flex items-center space-x-3">
        <Checkbox
          id={`goal-${goal.id}`}
          checked={goal.completed}
          onCheckedChange={handleToggleComplete}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          disabled={!isCurrentRoomWritable}
        />
        <label
          htmlFor={`goal-${goal.id}`}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            goal.completed ? "line-through text-muted-foreground" : "text-foreground"
          )}
        >
          {goal.title}
        </label>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="text-muted-foreground hover:text-destructive"
        title="Delete goal"
        disabled={!isCurrentRoomWritable}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete goal</span>
      </Button>
    </div>
  );
}