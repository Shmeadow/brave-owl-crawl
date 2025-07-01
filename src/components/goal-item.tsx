"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoalData } from "@/hooks/use-goals";

interface GoalItemProps {
  goal: GoalData;
  onToggleComplete: (goalId: string, currentCompleted: boolean) => void;
  onDelete: (goalId: string) => void;
}

export function GoalItem({ goal, onToggleComplete, onDelete }: GoalItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-md bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <Checkbox
          id={`goal-${goal.id}`}
          checked={goal.completed}
          onCheckedChange={() => onToggleComplete(goal.id, goal.completed)}
          className="h-5 w-5"
        />
        <label
          htmlFor={`goal-${goal.id}`}
          className={cn(
            "text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            goal.completed && "line-through text-muted-foreground"
          )}
        >
          {goal.title}
        </label>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:bg-red-100 hover:text-red-600"
        onClick={() => onDelete(goal.id)}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete Goal</span>
      </Button>
    </div>
  );
}