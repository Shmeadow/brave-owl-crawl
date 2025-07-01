"use client";

import React from "react";
import { GoalItem } from "@/components/goal-item";
import { GoalData } from "@/hooks/use-goals";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GoalListProps {
  goals: GoalData[];
  onToggleComplete: (goalId: string, currentCompleted: boolean) => void;
  onDelete: (goalId: string) => void;
}

export function GoalList({ goals, onToggleComplete, onDelete }: GoalListProps) {
  return (
    <Card className="w-full flex flex-col flex-1 bg-card/40 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Your Goals</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {goals.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm text-center">No goals added yet. Start by adding one above!</p>
        ) : (
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-3">
              {goals.map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}