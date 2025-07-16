"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, CalendarIcon } from "lucide-react";
import { TaskData } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";

const editFormSchema = z.object({
  title: z.string().min(1, { message: "Task title cannot be empty." }),
  description: z.string().nullable().optional(),
  dueDate: z.date().nullable().optional(),
});

interface TaskItemProps {
  task: TaskData;
  onToggleComplete: (taskId: string, currentCompleted: boolean) => void;
  onUpdateTask: (taskId: string, updatedData: Partial<TaskData>) => void;
  onDelete: (taskId: string) => void;
  isCurrentRoomWritable: boolean;
}

export function TaskItem({ task, onToggleComplete, onUpdateTask, onDelete, isCurrentRoomWritable }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
    },
  });

  const handleToggleComplete = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to update tasks in this room.");
      return;
    }
    onToggleComplete(task.id, task.completed);
  };

  const handleDelete = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete tasks in this room.");
      return;
    }
    onDelete(task.id);
  };

  const handleEdit = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit tasks in this room.");
      return;
    }
    setIsEditing(true);
  };

  const onSubmit = (values: z.infer<typeof editFormSchema>) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit tasks in this room.");
      return;
    }
    onUpdateTask(task.id, {
      title: values.title,
      description: values.description || null,
      due_date: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : null,
    });
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-start justify-between p-3 border rounded-md bg-card backdrop-blur-xl text-card-foreground shadow-sm",
          task.completed ? "opacity-60" : ""
        )}
      >
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground mt-1 flex-shrink-0"
            disabled={!isCurrentRoomWritable}
          />
          <div className="flex-1 min-w-0">
            <label
              htmlFor={`task-${task.id}`}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                task.completed ? "line-through text-muted-foreground" : "text-foreground"
              )}
            >
              {task.title}
            </label>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
            {task.due_date && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
            title="Edit task"
            disabled={!isCurrentRoomWritable}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit task</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
            title="Delete task"
            disabled={!isCurrentRoomWritable}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete task</span>
          </Button>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} disabled={!isCurrentRoomWritable} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
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
    </>
  );
}