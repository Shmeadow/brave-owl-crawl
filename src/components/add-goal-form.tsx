"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, { message: "Goal title cannot be empty." }),
});

interface AddGoalFormProps {
  onAddGoal: (title: string) => void;
  isCurrentRoomWritable: boolean;
}

export function AddGoalForm({ onAddGoal, isCurrentRoomWritable }: AddGoalFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add goals in this room.");
      return;
    }
    onAddGoal(values.title);
    form.reset();
    toast.success("Goal added successfully!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-start gap-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormControl>
                <Input placeholder="e.g., Learn React Hooks" {...field} disabled={!isCurrentRoomWritable} />
              </FormControl>
              <FormMessage className="mt-1" />
            </FormItem>
          )}
        />
        <Button type="submit" size="icon" disabled={!isCurrentRoomWritable} aria-label="Add Goal">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}