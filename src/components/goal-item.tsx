"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";
import { GoalData } from "@/hooks/use-goals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GoalStats } from "./goal-stats";

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
    <Collapsible>
      <div
        className={cn(
          "group flex items-center justify-between p-3 border-b transition-colors hover:bg-muted/50",
          goal.completed ? "opacity-60" : ""
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
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
            title="Delete goal"
            disabled={!isCurrentRoomWritable}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete goal</span>
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Toggle stats</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent>
        <GoalStats goal={goal} />
      </CollapsibleContent>
    </Collapsible>
  );
}