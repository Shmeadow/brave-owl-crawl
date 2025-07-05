"use client";

import React, { useState, useEffect } from 'react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface FlashcardFormProps {
  editingCard: CardData | null;
  onAddCard: (data: Omit<CardData, 'id' | 'user_id' | 'created_at' | 'status' | 'seen_count' | 'last_reviewed_at' | 'interval_days' | 'correct_guesses' | 'incorrect_guesses'>) => void;
  onUpdateCard: (id: string, data: Partial<CardData>) => void;
  onCancelEdit: () => void;
  categories: Category[];
  onAddCategory: (name: string) => void;
}

export const FlashcardForm: React.FC<FlashcardFormProps> = ({
  editingCard,
  onAddCard,
  onUpdateCard,
  onCancelEdit,
  categories,
  onAddCategory,
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [starred, setStarred] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (editingCard) {
      setFront(editingCard.front);
      setBack(editingCard.back);
      setCategoryId(editingCard.category_id ?? undefined);
      setStarred(editingCard.starred ?? false);
    } else {
      setFront('');
      setBack('');
      setCategoryId(undefined);
      setStarred(false);
    }
  }, [editingCard]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      toast.error("Both front and back fields are required.");
      return;
    }

    const cardData = {
      front,
      back,
      category_id: categoryId === 'none' ? null : (categoryId || null),
      starred,
    };

    if (editingCard) {
      onUpdateCard(editingCard.id, cardData);
      toast.success("Card updated successfully!");
    } else {
      onAddCard(cardData);
      toast.success("Card added successfully!");
    }
    
    setFront('');
    setBack('');
    setCategoryId(undefined);
    setStarred(false);
    onCancelEdit();
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingCard ? 'Edit Flashcard' : 'Add New Flashcard'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="front">Front</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="e.g., ¿Cómo te llamas?"
              required
            />
          </div>
          <div>
            <Label htmlFor="back">Back</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="e.g., What is your name?"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="starred" checked={starred} onCheckedChange={setStarred} />
            <Label htmlFor="starred">Star this card</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-grow">{editingCard ? 'Update Card' : 'Add Card'}</Button>
            {editingCard && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
        <div className="mt-4 pt-4 border-t">
          <Label htmlFor="new-category">Add New Category</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="new-category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Spanish Verbs"
            />
            <Button onClick={handleAddNewCategory} variant="secondary">Add</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};