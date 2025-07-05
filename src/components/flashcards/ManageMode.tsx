"use client";

import React, { useState, useMemo, useRef } from 'react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Move, Upload, RefreshCcw } from 'lucide-react';
import { FlashcardForm } from './FlashcardForm';
import { FlashcardListItem } from './FlashcardListItem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ManageModeProps {
  cards: CardData[];
  editingCard: CardData | null;
  onAddCard: (data: Omit<CardData, 'id' | 'user_id' | 'created_at' | 'status' | 'seen_count' | 'last_reviewed_at' | 'interval_days' | 'correct_guesses' | 'incorrect_guesses'>) => void;
  onUpdateCard: (id: string, data: Partial<CardData>) => void;
  onDeleteCard: (id:string) => void;
  onEdit: (card: CardData) => void;
  onCancelEdit: () => void;
  onResetProgress: () => void;
  onBulkImport: (file: File) => void;
  categories: Category[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onUpdateCardCategory: (cardId: string, categoryId: string | null) => void;
}

export function ManageMode({
  cards,
  editingCard,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onEdit,
  onCancelEdit,
  onResetProgress,
  onBulkImport,
  categories,
  onAddCategory,
  onUpdateCardCategory
}: ManageModeProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectionMode = selectedCards.length > 0;

  const filteredCards = useMemo(() => {
    if (selectedCategoryId === 'all') return cards;
    return cards.filter(card => card.category_id === selectedCategoryId);
  }, [cards, selectedCategoryId]);

  const handleToggleSelect = (id: string) => {
    setSelectedCards(prev =>
      prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCards.length === filteredCards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map(c => c.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedCards.length === 0) return;
    selectedCards.forEach(id => onDeleteCard(id));
    toast.success(`Deleted ${selectedCards.length} cards.`);
    setSelectedCards([]);
  };

  const handleBulkMove = () => {
    if (selectedCards.length === 0 || !targetCategoryId) return;
    selectedCards.forEach(id => onUpdateCardCategory(id, targetCategoryId === 'none' ? null : targetCategoryId));
    toast.success(`Moved ${selectedCards.length} cards.`);
    setSelectedCards([]);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onBulkImport(file);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 w-full">
      <div className="md:col-span-1 space-y-6">
        <FlashcardForm
          key={editingCard?.id ?? 'new'}
          editingCard={editingCard}
          onAddCard={onAddCard}
          onUpdateCard={onUpdateCard}
          onCancelEdit={onCancelEdit}
          categories={categories}
          onAddCategory={onAddCategory}
        />
        <Card>
          <CardHeader><CardTitle>Deck Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {selectionMode && (
              <>
                <p className="text-sm text-muted-foreground">{selectedCards.length} cards selected.</p>
                <div className="flex items-center gap-2">
                  <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Move to category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleBulkMove} size="icon" variant="outline" disabled={!targetCategoryId}>
                    <Move className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleBulkDelete} variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
                <Button onClick={() => setSelectedCards([])} variant="ghost" className="w-full">
                  Clear Selection
                </Button>
                <hr className="my-2" />
              </>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".csv, text/csv"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" /> Import from CSV
            </Button>
            <Button onClick={onResetProgress} variant="destructive" className="w-full">
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Progress
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Resetting progress will clear all learning stats for every card.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>My Deck ({filteredCards.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSelectAll} variant="outline">
                  {filteredCards.length > 0 && selectedCards.length === filteredCards.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCards.length > 0 ? (
              <ul className="space-y-3">
                {filteredCards.map(card => (
                  <FlashcardListItem
                    key={card.id}
                    card={card}
                    onEdit={onEdit}
                    onDelete={onDeleteCard}
                    selectionMode={selectionMode || selectedCards.includes(card.id)}
                    isSelected={selectedCards.includes(card.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-8">No cards in this category. Add one to get started!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}