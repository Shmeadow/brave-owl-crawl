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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formSchema = z.object({
  front: z.string().min(1, { message: "Front of card cannot be empty." }),
  back: z.string().min(1, { message: "Back of card cannot be empty." }),
});

interface EditFlashCardFormProps {
  initialData: { front: string; back: string };
  onSave: (card: { front: string; back: string }) => void;
  onCancel: () => void;
}

export function EditFlashCardForm({ initialData, onSave, onCancel }: EditFlashCardFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values);
    toast.success("Flashcard updated successfully!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormField
          control={form.control}
          name="front"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Front (Question)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., What is the capital of France?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="back"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Back (Answer)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Paris" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}