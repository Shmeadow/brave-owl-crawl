"use client";

import React, { useState, useMemo } from 'react';
import { CategorySidebar } from './CategorySidebar';
import { FlashcardList } from './FlashcardList';
import { FlashcardForm } from './FlashcardForm';
import { ImportExport } from './ImportExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { OrganizeCardModal } from './OrganizeCardModal';
import { toast } from 'sonner';

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
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category | null>;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onUpdateCardCategory: (cardId: string, newCategoryId: string | null) => void;
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
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onUpdateCardCategory,
}: ManageModeProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [organizingCard, setOrganizingCard] = useState<CardData | null>(null);

  const filteredCards = useMemo(() => {
    return cards.filter(card => card.category_id === selectedCategoryId);
  }, [cards, selectedCategoryId]);

  const handleSave = async (cardData: { id?: string; front: string; back: string }) => {
    let categoryIdToSave = selectedCategoryId;
    const isTrueFalseCard = cardData.front.toLowerCase().includes('true or false') || cardData.back.toLowerCase().includes('true or false');

    if (isTrueFalseCard) {
      let tfCategory: Category | undefined | null = categories.find(c => c.name.toLowerCase() === 'true or false');
      if (!tfCategory) {
        tfCategory = await onAddCategory('True or False');
      }
      if (tfCategory) {
        categoryIdToSave = tfCategory.id;
      }
    }

    const dataToSave = { ...cardData, category_id: categoryIdToSave };
    if (cardData.id) {
      onUpdateCard(cardData.id, dataToSave);
    } else {
      onAddCard(dataToSave);
    }
    onCancelEdit();
  };

  const handleOrganizeTrueFalse = async () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to organize cards.");
      return;
    }

    const tfCards = cards.filter(c =>
      (c.front.toLowerCase().includes('true or false') || c.back.toLowerCase().includes('true or false'))
    );

    if (tfCards.length === 0) {
      toast.info("No 'True or False' cards found to organize.");
      return;
    }

    let tfCategory: Category | undefined | null = categories.find(c => c.name.toLowerCase() === 'true or false');
    if (!tfCategory) {
      tfCategory = await onAddCategory('True or False');
    }

    if (!tfCategory) {
      toast.error("Could not create or find the 'True or False' category.");
      return;
    }

    const tfCategoryId = tfCategory.id;
    let organizedCount = 0;
    const promises = [];
    for (const card of tfCards) {
      if (card.category_id !== tfCategoryId) {
        promises.push(onUpdateCardCategory(card.id, tfCategoryId));
        organizedCount++;
      }
    }
    
    await Promise.all(promises);

    if (organizedCount > 0) {
      toast.success(`Successfully organized ${organizedCount} 'True or False' cards.`);
    } else {
      toast.info("All 'True or False' cards are already in the correct category.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
          onUpdateCategory={onUpdateCategory}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />
        <FlashcardList
          flashcards={filteredCards}
          onEdit={onEdit}
          onDelete={onDeleteCard}
          onOrganize={setOrganizingCard}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />
      </div>
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        <FlashcardForm
          onSave={handleSave}
          editingCard={editingCard}
          onCancel={onCancelEdit}
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
          <CardContent className="flex flex-col gap-4">
            <Button
              onClick={handleOrganizeTrueFalse}
              variant="secondary"
              className="w-full"
              disabled={!isCurrentRoomWritable}
            >
              Organize 'True or False' Cards
            </Button>
            <div>
              <Button
                onClick={onResetProgress}
                variant="destructive"
                className="w-full"
                disabled={!isCurrentRoomWritable}
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Progress & Stats
              </Button>
              <p className="text-xs text-muted-foreground mt-2">This will reset the status and guess statistics for all cards in this deck.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <OrganizeCardModal
        card={organizingCard}
        categories={categories}
        isOpen={!!organizingCard}
        onClose={() => setOrganizingCard(null)}
        onUpdateCategory={onUpdateCardCategory}
        isCurrentRoomWritable={isCurrentRoomWritable}
      />
    </div>
  );
}