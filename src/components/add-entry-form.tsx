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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components

const formSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty." }),
  content: z.string().min(1, { message: "Entry content cannot be empty." }),
  type: z.enum(['note', 'journal']), // New field for type
});

interface AddEntryFormProps {
  onAddEntry: (entry: { title: string; content: string; type: 'note' | 'journal' }) => void;
  isCurrentRoomWritable: boolean;
  defaultType: 'note' | 'journal'; // New prop for default type
  showTypeToggle?: boolean; // New prop to control visibility of type toggle
}

export function AddEntryForm({ onAddEntry, isCurrentRoomWritable, defaultType, showTypeToggle = true }: AddEntryFormProps) {
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
      toast.error("You do not have permission to add entries in this room.");
      return;
    }
    onAddEntry(values);
    form.reset({ type: values.type }); // Reset form but keep selected type
    toast.success("Entry added successfully!");
  }

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Add New Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
            {showTypeToggle && (
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
            )}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Your entry's title or today's date..." {...field} disabled={!isCurrentRoomWritable} />
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