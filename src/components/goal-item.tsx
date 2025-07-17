"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, Edit, CalendarIcon } from "lucide-react";
import { GoalData } from "@/hooks/use-goals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GoalStats } from "./goal-stats";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const editGoalFormSchema = z.object({
  title: z.string().min(1, { message: "Goal title cannot be empty." }),
  description: z.string().nullable().optional(),
  targetCompletionDate: z.date().nullable().optional(),
});

interface GoalItemProps {
  goal: GoalData;
  onToggleComplete: (goalId: string, currentCompleted: boolean) => void;
  onUpdateGoal: (goalId: string, updatedData: Partial<GoalData>) => void; // New prop
  onDelete: (goalId: string) => void;
  isCurrentRoomWritable: boolean;
}

export function GoalItem({ goal, onToggleComplete, onUpdateGoal, onDelete, isCurrentRoomWritable }: GoalItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof editGoalFormSchema>>({
    resolver: zodResolver(editGoalFormSchema),
    defaultValues: {
      title: goal.title,
      description: goal.description || "",
      targetCompletionDate: goal.target_completion_date ? new Date(goal.target_completion_date) : undefined,
    },
  });

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

  const handleEdit = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit goals in this room.");
      return;
    }
    setIsEditing(true);
  };

  const onSubmitEdit = (values: z.infer<typeof editGoalFormSchema>) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit goals in this room.");
      return;
    }
    onUpdateGoal(goal.id, {
      title: values.title,
      description: values.description || null,
      target_completion_date: values.targetCompletionDate ? format(values.targetCompletionDate, 'yyyy-MM-dd') : null,
    });
    setIsEditing(false);
  };

  return (
    <Collapsible>
      <div
        className={cn(
          "group flex items-center justify-between p-4 border-b transition-colors hover:bg-muted/50",
          goal.completed ? "opacity-60" : ""
        )}
      >
        <div className="flex items-center space-x-4">
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9"
            title="Edit goal"
            disabled={!isCurrentRoomWritable}
          >
            <Edit className="h-5 w-5" />
            <span className="sr-only">Edit goal</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9"
            title="Delete goal"
            disabled={!isCurrentRoomWritable}
          >
            <Trash2 className="h-5 w-5" />
            <span className="sr-only">Delete goal</span>
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ChevronDown className="h-5 w-5" />
              <span className="sr-only">Toggle stats</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent>
        <GoalStats goal={goal} />
      </CollapsibleContent>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isCurrentRoomWritable} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} rows={3} disabled={!isCurrentRoomWritable} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetCompletionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Target Completion Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!isCurrentRoomWritable}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={!isCurrentRoomWritable}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}