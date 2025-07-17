"use client";

import React from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
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
import { PomodoroMode } from "@/hooks/use-pomodoro-state";
import { DialogContent } from "@/components/ui/dialog";
import { useCurrentRoom } from "@/hooks/use-current-room"; // Import useCurrentRoom

const formSchema = z.object({
  focusMinutes: z.coerce.number().min(1, { message: "Focus time must be at least 1 minute." }).max(120, { message: "Focus time cannot exceed 120 minutes." }),
  shortBreakMinutes: z.coerce.number().min(1, { message: "Short break must be at least 1 minute." }).max(30, { message: "Short break cannot exceed 30 minutes." }),
  longBreakMinutes: z.coerce.number().min(1, { message: "Long break must be at least 1 minute." }).max(60, { message: "Long break cannot exceed 60 minutes." }),
});

interface PomodoroSettingsModalProps {
  initialTimes: {
    'focus': number;
    'short-break': number;
    'long-break': number;
  };
  onSave: (mode: PomodoroMode, newTimeInSeconds: number) => void;
}

export function PomodoroSettingsModal({ initialTimes, onSave }: PomodoroSettingsModalProps) {
  const { isCurrentRoomWritable } = useCurrentRoom(); // Get writability status
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      focusMinutes: initialTimes.focus / 60,
      shortBreakMinutes: initialTimes['short-break'] / 60,
      longBreakMinutes: initialTimes['long-break'] / 60,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to change Pomodoro settings in this room.");
      return;
    }
    onSave('focus', values.focusMinutes * 60);
    onSave('short-break', values.shortBreakMinutes * 60);
    onSave('long-break', values.longBreakMinutes * 60);
    toast.success("Pomodoro settings saved!");
  }

  return (
    <DialogContent className="sm:max-w-[425px] z-[1001] bg-card backdrop-blur-xl border-white/20">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="focusMinutes"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof formSchema>, "focusMinutes"> }) => (
              <FormItem>
                <FormLabel>Focus Time (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={!isCurrentRoomWritable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shortBreakMinutes"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof formSchema>, "shortBreakMinutes"> }) => (
              <FormItem>
                <FormLabel>Short Break (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={!isCurrentRoomWritable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longBreakMinutes"
            render={({ field }: { field: ControllerRenderProps<z.infer<typeof formSchema>, "longBreakMinutes"> }) => (
              <FormItem>
                <FormLabel>Long Break (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={!isCurrentRoomWritable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={!isCurrentRoomWritable}>Save Settings</Button>
        </form>
      </Form>
    </DialogContent>
  );
}