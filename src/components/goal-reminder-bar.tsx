"use client";

import React, { useState, useEffect } from "react";
import { useGoals } from "@/hooks/use-goals";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } => "@/components/ui/button";
import { Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { toast } from "sonner";

export function GoalReminderBar() {
  const { goals, loading, handleToggleComplete, handleDeleteGoal } = useGoals();
  const { isCurrentRoomWritable } = useCurrentRoom();
  const [displayIndex, setDisplayIndex] = useState(0);

  const incompleteGoals = goals.filter(goal => !goal.completed);

  useEffect(() => {
    if (displayIndex >= incompleteGoals.length) {
      setDisplayIndex(0);
    }
  }, [incompleteGoals.length, displayIndex]);

  const activeGoal = incompleteGoals[displayIndex];

  const handleToggleCompleteClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to update goals in this room.");
      return;
    }
    if (activeGoal) {
      handleToggleComplete(activeGoal.id, activeGoal.completed);
    }
  };

  const handleDeleteGoalClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete goals in this room.");
      return;
    }
    if (activeGoal) {
      handleDeleteGoal(activeGoal.id);
    }
  };

  if (loading || !activeGoal) {
    return null;
  }

  const handleNextGoal = () => {
    setDisplayIndex((prevIndex) => (prevIndex + 1) % incompleteGoals.length);
  };

  return (
    <div className="fixed top-16 left-4 z-50 w-full max-w-xs">
      <Card className="bg-card backdrop-blur-xl border-white/20 shadow-lg">
        <CardContent className="flex items-center justify-between p-2 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox
              id={`reminder-goal-${activeGoal.id}`}
              checked={activeGoal.completed}
              onCheckedChange={handleToggleCompleteClick}
              className="h-4 w-4"
              disabled={!isCurrentRoomWritable}
            />
            <label
              htmlFor={`reminder-goal-${activeGoal.id}`}
              className={cn(
                "text-sm font-medium leading-none truncate",
                activeGoal.completed && "line-through text-muted-foreground"
              )}
            >
              {activeGoal.title}
            </label>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-5 w-5"
              onClick={handleDeleteGoalClick}
              disabled={!isCurrentRoomWritable}
            >
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Delete Goal</span>
            </Button>
            {incompleteGoals.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-5 w-5"
                onClick={handleNextGoal}
              >
                <ChevronRight className="h-3 w-3" />
                <span className="sr-only">Next Goal</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}