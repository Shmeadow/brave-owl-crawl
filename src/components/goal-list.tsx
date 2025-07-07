"use client";

import React from "react";
import { GoalItem } from "@/components/goal-item";
import { GoalData } from "@/hooks/use-goals";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GoalListProps {
  goals: GoalData[];
  onToggleComplete: (goalId: string, currentCompleted: boolean) => void;
  onDelete: (goalId: string) => void;
  isCurrentRoomWritable: boolean;
}

export function GoalList({ goals, onToggleComplete, onDelete, isCurrentRoomWritable }: GoalListProps) {
  return (
    <div className="w-full flex-1 flex flex-col bg-card/40 backdrop-blur-xl border border-white/20 rounded-lg">
      {goals.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm text-center">No goals added yet. Start by adding one above!</p>
        </div>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-2">
            {goals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                isCurrentRoomWritable={isCurrentRoomWritable}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}