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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Goal</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Learn React Hooks" {...field} disabled={!isCurrentRoomWritable} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={!isCurrentRoomWritable}>Add Goal</Button>
      </form>
    </Form>
  );
}