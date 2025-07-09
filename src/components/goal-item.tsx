"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, Edit, CalendarIcon } from "lucide-react";
import { GoalData } from "@/hooks/use-goals";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} => "@/components/ui/collapsible";
import { GoalStats } from "./goal-stats";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } => "@/components/ui/dialog";
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
import { Popover, PopoverContent, PopoverTrigger } => "@/components/ui/popover";
import { Calendar } => "@/components/ui/calendar";
import { format } from "date-fns";
import { useForm, ControllerProps, FieldValues } from "react-hook-form";
import { zodResolver } => "@hookform/resolvers/zod";
import { z } from "zod";

const editGoalFormSchema = z.object({
  title: z.string().min(1, { message: "Goal title cannot be empty." }),
  description: z.string().nullable().optional(),
  targetCompletionDate: z.union([z.date(), z.null()]).optional(), // Allow null/undefined
});

interface GoalItemProps {
  goal: GoalData;
  onToggleComplete: (goalId: string, currentCompleted: boolean) => void;
  onUpdateGoal: (goalId: string, updatedData: Partial<GoalData>) => void;
  onDelete: (goalId: string) => void;
  isCurrentRoomWritable: boolean;
}

export const DateController: React.FC<ControllerProps> = ({
  control,
  name,
  rules,
  shouldUnregister,
  render,
}) => {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      render={({ field }) => {
        // Handle Date and null/undefined coercion
        const selectedDate = field.value ? new Date(field.value) : null;
        return render({ ...field, value: selectedDate });
      }}
    />
  );
};

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
    onToggleComplete(goal.id, !goal.completed);
  };

  const handleDelete = () => {
    onDelete(goal.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmitEdit = (values: z.infer<typeof editGoalFormSchema>) => {
    onUpdateGoal(goal.id, {
      title: values.title,
      description: values.description || null,
      target_completion_date: values.targetCompletionDate?.toISOString().split('T')[0] || null,
    });
    setIsEditing(false);
  };

  return (
    <Collapsible>
      <div
        className={cn(
          "group flex items-center justify-between p-3 border-b transition-colors hover:bg-muted/50",
          goal.completed ? "opacity-60" : "opacity-100"
        )}
      >
        <div className="flex items-center gap-3">
          <Checkbox
            id={`goal-checkbox-${goal.id}`}
            checked={goal.completed}
            onCheckedChange={handleToggleComplete}
            disabled={!isCurrentRoomWritable}
          />
          <label
            htmlFor={`goal-checkbox-${goal.id}`}
            className={cn(
              "font-medium",
              goal.completed ? "line-through text-muted-foreground" : "",
              isCurrentRoomWritable ? "cursor-pointer" : "",
            )}
          >
            {goal.title}
          </label>
        </div>

        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" disabled={!isCurrentRoomWritable} className="p-0">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Toggle goal details</span>
            </Button>
          </CollapsibleTrigger>
          <Button variant="ghost" size="sm" onClick={handleEdit} disabled={!isCurrentRoomWritable} className="p-0">
            <Edit className="h-4 w-4 text-muted hover:text-blue-500" />
            <span className="sr-only">Edit goal</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={!isCurrentRoomWritable} className="p-0">
            <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
            <span className="sr-only">Delete goal</span>
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        <GoalStats goal={goal} />
      </CollapsibleContent>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {goal.completed ? "Update Completed Goal" : "Update Active Goal"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Learn React" />
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
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Goal description"
                        className="resize-none"
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DateController
                control={form.control}
                name="targetCompletionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Target Completion Date (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                            onClick={() => field.value && field.onChange(field.value)}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}