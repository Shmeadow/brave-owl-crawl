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
import { CardData, Category } from '@/hooks/flashcards/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  front: z.string().min(1, { message: "Front of card cannot be empty." }),
  back: z.string().min(1, { message: "Back of card cannot be empty." }),
  category_id: z.string().nullable().optional(),
});

interface FlashcardFormProps {
  onSave: (card: { id?: string; front: string; back: string; category_id?: string | null }) => void;
  editingCard: CardData | null;
  onCancel: () => void;
  categories: Category[];
  selectedCategoryId: string | 'all' | null;
}

export function FlashcardForm({ onSave, editingCard, onCancel, categories, selectedCategoryId }: FlashcardFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      front: '',
      back: '',
      category_id: null,
    },
  });

  useEffect(() => {
    const defaultCategoryId = editingCard
      ? editingCard.category_id
      : (selectedCategoryId === 'all' ? null : selectedCategoryId);

    form.reset({
      front: editingCard?.front || '',
      back: editingCard?.back || '',
      category_id: defaultCategoryId,
    });
  }, [editingCard, selectedCategoryId, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({ id: editingCard?.id, ...values });
    form.reset({ front: '', back: '', category_id: values.category_id });
    toast.success(editingCard ? "Flashcard updated successfully!" : "Flashcard added successfully!");
  }

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>{editingCard ? 'Edit Flashcard' : 'Add New Flashcard'}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Textarea placeholder="e.g., Paris" {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'null' ? null : value)}
                    defaultValue={field.value || 'null'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Removed SelectItem for "Uncategorized" */}
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button type="submit">
                {editingCard ? 'Update Card' : 'Add Card'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}