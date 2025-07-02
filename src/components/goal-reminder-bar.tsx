"use client";

import React, { useState, useEffect } from "react";
import { useGoals } from "@/hooks/use-goals";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronRight } from "lucide-react"; // Import ChevronRight for the next button
import { cn } from "@/lib/utils";

export function GoalReminderBar() {
  const { goals, loading, handleToggleComplete, handleDeleteGoal } = useGoals();
  const [displayIndex, setDisplayIndex] = useState(0); // State to track which incomplete goal is currently displayed

  // Filter all incomplete goals
  const incompleteGoals = goals.filter(goal => !goal.completed);

  // Reset displayIndex if the number of incomplete goals changes or if the current index is out of bounds
  useEffect(() => {
    if (displayIndex >= incompleteGoals.length) {
      setDisplayIndex(0);
    }
  }, [incompleteGoals.length, displayIndex]);

  // The active goal to display in the bar
  const activeGoal = incompleteGoals[displayIndex];

  // Only render if not loading and an active goal exists
  if (loading || !activeGoal) {
    return null;
  }

  // Function to move to the next incomplete goal in the list
  const handleNextGoal = () => {
    setDisplayIndex((prevIndex) => (prevIndex + 1) % incompleteGoals.length);
  };

  return (
    <div className="fixed top-16 left-4 z-50 w-full max-w-xs">
      <Card className="bg-card backdrop-blur-xl border-white/20 shadow-lg"> {/* Applied glass effect here, removed /40 */}
        <CardContent className="flex items-center justify-between p-2 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox
              id={`reminder-goal-${activeGoal.id}`}
              checked={activeGoal.completed}
              onCheckedChange={() => handleToggleComplete(activeGoal.id, activeGoal.completed)}
              className="h-4 w-4"
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
              onClick={() => handleDeleteGoal(activeGoal.id)}
            >
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Delete Goal</span>
            </Button>
            {incompleteGoals.length > 1 && ( // Only show next button if there's more than one incomplete goal
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