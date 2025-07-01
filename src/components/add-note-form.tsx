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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formSchema = z.object({
  content: z.string().min(1, { message: "Note content cannot be empty." }),
});

interface AddNoteFormProps {
  onAddNote: (content: string) => void;
}

export function AddNoteForm({ onAddNote }: AddNoteFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddNote(values.content);
    form.reset();
    toast.success("Note added successfully!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Note</FormLabel>
              <FormControl>
                <Textarea placeholder="Write your note here..." {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Add Note</Button>
      </form>
    </Form>
  );
}