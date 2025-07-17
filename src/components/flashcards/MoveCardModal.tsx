"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardData, Category } from '@/hooks/flashcards/types';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface MoveCardModalProps {
  card: CardData | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateCardCategory: (cardId: string, newCategoryId: string | null) => void;
}

export function MoveCardModal({ card, categories, isOpen, onClose, onUpdateCardCategory }: MoveCardModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(card?.category_id || null);

  React.useEffect(() => {
    setSelectedCategoryId(card?.category_id || null);
  }, [card]);

  const handleConfirmMove = () => {
    if (!card) return;
    onUpdateCardCategory(card.id, selectedCategoryId);
    onClose();
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Organize &quot;{card.front}&quot;</DialogTitle>
          <DialogDescription>
            Move this flashcard to a different category.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="category-select">Select Category</Label>
          <Select
            value={selectedCategoryId || 'null'}
            onValueChange={(value: string) => setSelectedCategoryId(value === 'null' ? null : value)}
          >
            <SelectTrigger id="category-select">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Uncategorized</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirmMove}>Move Card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}