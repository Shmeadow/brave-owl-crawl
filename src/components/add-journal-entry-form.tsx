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
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamically import TrixEditor with SSR disabled
const DynamicTrixEditor = dynamic(() => import("./trix-editor").then(mod => mod.TrixEditor), { ssr: false });

const today = new Date();
const dateString = today.toLocaleDateString('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const formSchema = z.object({
  prefix: z.string().optional(),
  content: z.string().min(1, { message: "Entry content cannot be empty." }),
});

interface AddJournalEntryFormProps {
  onAddEntry: (entry: { title: string; content: string }) => void;
  isCurrentRoomWritable: boolean;
}

export function AddJournalEntryForm({ onAddEntry, isCurrentRoomWritable }: AddJournalEntryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prefix: "",
      content: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add journal entries in this room.");
      return;
    }
    const title = values.prefix ? `${values.prefix} - ${dateString}` : dateString;
    onAddEntry({ title, content: values.content });
    form.reset();
  }

  return (
    <div className="p-6 pt-0">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
          <FormField
            control={form.control}
            name="prefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input placeholder="Daily Reflection" {...field} disabled={!isCurrentRoomWritable} />
                  </FormControl>
                  <span className="text-muted-foreground whitespace-nowrap">- {dateString}</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <DynamicTrixEditor
                    content={field.value}
                    onChange={field.onChange}
                    disabled={!isCurrentRoomWritable}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={!isCurrentRoomWritable}>Add Entry</Button>
        </form>
      </Form>
    </div>
  );
}