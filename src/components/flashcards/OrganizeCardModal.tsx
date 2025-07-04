"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardData, Category } from '@/hooks/flashcards/types';
import { toast } from 'sonner';

interface OrganizeCardModalProps {
  card: CardData | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: (cardId: string, newCategoryId: string | null) => void;
}

export function OrganizeCardModal({ card, categories, isOpen, onClose, onUpdateCategory }: OrganizeCardModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(card?.category_id || null);

  if (!card) return null;

  const handleSave = () => {
    onUpdateCategory(card.id, selectedCategoryId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Organize Flashcard</DialogTitle>
          <DialogDescription>Move "{card.front}" to a different category.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            onValueChange={(value) => setSelectedCategoryId(value === 'null' ? null : value)}
            defaultValue={card.category_id || 'null'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Uncategorized</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}