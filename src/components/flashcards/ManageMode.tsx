"use client";

import React, { useState, useMemo } from 'react';
import { CategorySidebar } from './CategorySidebar';
import { FlashcardList } from './FlashcardList';
import { FlashcardForm } from './FlashcardForm';
import { ImportExport } from './ImportExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { useFlashcardCategories } from '@/hooks/flashcards/useFlashcardCategories';
import { CardData } from '@/hooks/flashcards/types';

interface ManageModeProps {
  cards: CardData[];
  editingCard: CardData | null;
  onAddCard: (card: { front: string; back: string; category_id?: string | null }) => void;
  onUpdateCard: (id: string, card: { front: string; back: string; category_id?: string | null }) => void;
  onDeleteCard: (id: string) => void;
  onEdit: (card: CardData) => void;
  onCancelEdit: () => void;
  onResetProgress: () => void;
  onBulkImport: (cards: { front: string; back: string }[], categoryId: string | null) => Promise<number>;
  isCurrentRoomWritable: boolean;
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
  isCurrentRoomWritable,
}: ManageModeProps) {
  const { categories, addCategory, deleteCategory, updateCategory } = useFlashcardCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    return cards.filter(card => card.category_id === selectedCategoryId);
  }, [cards, selectedCategoryId]);

  const handleSave = (cardData: { id?: string; front: string; back: string }) => {
    const dataToSave = { ...cardData, category_id: selectedCategoryId };
    if (cardData.id) {
      onUpdateCard(cardData.id, dataToSave);
    } else {
      onAddCard(dataToSave);
    }
    onCancelEdit();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      <CategorySidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onUpdateCategory={updateCategory}
        isCurrentRoomWritable={isCurrentRoomWritable}
      />
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        <FlashcardForm
          onSave={handleSave}
          editingCard={editingCard}
          onCancel={onCancelEdit}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />
        <FlashcardList
          flashcards={filteredCards}
          onEdit={onEdit}
          onDelete={onDeleteCard}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />
        <ImportExport
          cards={cards}
          onBulkImport={(newCards) => onBulkImport(newCards, selectedCategoryId)}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle>Deck Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onResetProgress}
              variant="destructive"
              className="w-full"
              disabled={!isCurrentRoomWritable}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Progress & Stats
            </Button>
            <p className="text-xs text-muted-foreground mt-2">This will reset the status and guess statistics for all cards in this deck.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}