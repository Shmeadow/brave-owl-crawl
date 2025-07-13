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
import { RichTextEditor } from "./rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty." }),
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
      title: "",
      content: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add journal entries in this room.");
      return;
    }
    onAddEntry(values);
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Today's thoughts, e.g., 'Morning Reflection'" {...field} disabled={!isCurrentRoomWritable} />
                  </FormControl>
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
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      disabled={!isCurrentRoomWritable}
                      noteId={null} // No noteId for new entries
                      annotations={[]} // No annotations for new entries
                      onAddAnnotation={async () => null} // Dummy function
                      onDeleteAnnotation={() => {}} // Dummy function
                      onUpdateAnnotationComment={() => {}} // Dummy function
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