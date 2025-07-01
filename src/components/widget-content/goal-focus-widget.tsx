"use client";

import React, { useState, useEffect } from "react";
import { useGoals } from "@/hooks/use-goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function GoalFocusWidget() {
  const { goals, loading, handleAddGoal, handleToggleComplete, handleDeleteGoal } = useGoals();
  const [newGoalTitle, setNewGoalTitle] = useState("");

  const handleAddGoalClick = async () => {
    if (newGoalTitle.trim()) {
      await handleAddGoal(newGoalTitle);
      setNewGoalTitle("");
      toast.success("Goal added successfully!");
    } else {
      toast.error("Goal title cannot be empty.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
      <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20 shadow-lg"> {/* Applied glass effect here */}
        <CardHeader>
          <CardTitle>Add New Goal</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Enter new goal"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddGoalClick();
              }
            }}
            className="flex-1 bg-background/60 border-white/30 text-foreground placeholder:text-muted-foreground"
          />
          <Button onClick={handleAddGoalClick} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20 shadow-lg"> {/* Applied glass effect here */}
        <CardHeader>
          <CardTitle>Your Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-muted-foreground text-center">No goals yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {goals.map((goal) => (
                <li key={goal.id} className="flex items-center justify-between p-2 rounded-md bg-background/30 hover:bg-background/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`goal-${goal.id}`}
                      checked={goal.completed}
                      onCheckedChange={() => handleToggleComplete(goal.id, goal.completed)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`goal-${goal.id}`}
                      className={cn(
                        "text-sm font-medium leading-none",
                        goal.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {goal.title}
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-6 w-6"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Goal</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}