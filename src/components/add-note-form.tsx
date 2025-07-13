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
import { Textarea } from "@/components/ui/textarea"; // Using Textarea for simple notes
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty." }),
  content: z.string().min(1, { message: "Note content cannot be empty." }),
});

interface AddNoteFormProps {
  onAddNote: (note: { title: string; content: string }) => void;
  isCurrentRoomWritable: boolean;
}

export function AddNoteForm({ onAddNote, isCurrentRoomWritable }: AddNoteFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add notes in this room.");
      return;
    }
    onAddNote(values);
    form.reset(); // Reset form after submission
    toast.success("Note added successfully!");
  }

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Add New Note</CardTitle>
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
                    <Input placeholder="Your note's title..." {...field} disabled={!isCurrentRoomWritable} />
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
                    <Textarea placeholder="Start writing your note here..." {...field} rows={6} disabled={!isCurrentRoomWritable} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={!isCurrentRoomWritable}>Add Note</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}