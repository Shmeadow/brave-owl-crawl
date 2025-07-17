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
import { RichTextEditor } from "./rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    form.reset(); // Reset form after submission
    toast.success("Journal entry added successfully!");
  }

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Add New Journal Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
            <FormField
              control={form.control}
              name="prefix"
              render={({ field }: { field: ControllerRenderProps<z.infer<typeof formSchema>, "prefix"> }) => (
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
              render={({ field }: { field: ControllerRenderProps<z.infer<typeof formSchema>, "content"> }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
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
      </CardContent>
    </Card>
  );
}