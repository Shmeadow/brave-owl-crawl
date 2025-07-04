"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CardData } from '@/hooks/use-firebase-flashcards';

const formSchema = z.object({
  term: z.string().min(1, { message: "Term cannot be empty." }),
  definition: z.string().min(1, { message: "Definition cannot be empty." }),
});

interface FlashcardFormProps {
  onSave: (card: { id?: string; term: string; definition: string }) => void;
  editingCard: CardData | null;
  onCancel: () => void;
  isCurrentRoomWritable: boolean;
}

export function FlashcardForm({ onSave, editingCard, onCancel, isCurrentRoomWritable }: FlashcardFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term: editingCard?.term || '',
      definition: editingCard?.definition || '',
    },
  });

  useEffect(() => {
    form.reset({
      term: editingCard?.term || '',
      definition: editingCard?.definition || '',
    });
  }, [editingCard, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add/edit flashcards in this room.");
      return;
    }
    onSave({ id: editingCard?.id, ...values });
    form.reset();
    toast.success(editingCard ? "Flashcard updated successfully!" : "Flashcard added successfully!");
  }

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>{editingCard ? 'Edit Flashcard' : 'Add New Flashcard'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Photosynthesis" {...field} disabled={!isCurrentRoomWritable} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Definition</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., The process by which green plants and some other organisms use sunlight to synthesize foods." {...field} rows={4} disabled={!isCurrentRoomWritable} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              {editingCard && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!isCurrentRoomWritable}>
                {editingCard ? 'Update Card' : 'Add Card'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}