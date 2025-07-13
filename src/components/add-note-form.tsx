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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup

const formSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty." }),
  content: z.string().min(1, { message: "Note content cannot be empty." }),
  type: z.enum(['note', 'journal']), // New field for type
});

interface AddNoteFormProps {
  onAddNote: (note: { title: string; content: string; type: 'note' | 'journal' }) => void;
  isCurrentRoomWritable: boolean;
  defaultType: 'note' | 'journal'; // New prop for default type
}

export function AddNoteForm({ onAddNote, isCurrentRoomWritable, defaultType }: AddNoteFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      type: defaultType, // Set default type from props
    },
  });

  // Update default type when defaultType prop changes
  React.useEffect(() => {
    form.setValue('type', defaultType);
  }, [defaultType, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add notes in this room.");
      return;
    }
    onAddNote(values);
    form.reset({ type: values.type }); // Reset form but keep selected type
    toast.success("Note added successfully!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entry Type</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(value: 'note' | 'journal') => value && field.onChange(value)}
                  disabled={!isCurrentRoomWritable}
                  className="grid grid-cols-2"
                >
                  <ToggleGroupItem value="note">Note</ToggleGroupItem>
                  <ToggleGroupItem value="journal">Journal Entry</ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Your note's title or today's date..." {...field} disabled={!isCurrentRoomWritable} />
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={!isCurrentRoomWritable}>Add Entry</Button>
      </form>
    </Form>
  );
}