"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { CategorySidebar } from './CategorySidebar';
import { FlashcardList } from './FlashcardList';
import { FlashcardForm } from './FlashcardForm';
import { ImportExport } from './ImportExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, LayoutGrid } from 'lucide-react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { OrganizeCardModal } from './OrganizeCardModal';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useFlashcards } from '@/hooks/use-flashcards';

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
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category | null>;
  onDeleteCategory: (id: string) => Promise<boolean>;
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
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onUpdateCardCategory,
}: ManageModeProps) {
  const { fetchCards } = useFlashcards();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all' | null>('all');
  const [organizingCard, setOrganizingCard] = useState<CardData | null>(null);
  const [columns, setColumns] = useState(3);

  const filteredCards = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return cards;
    }
    return cards.filter(card => card.category_id === selectedCategoryId);
  }, [cards, selectedCategoryId]);

  const handleSave = async (cardData: { id?: string; front: string; back: string; category_id?: string | null }) => {
    if (cardData.id) {
      onUpdateCard(cardData.id, cardData);
    } else {
      onAddCard(cardData);
    }
    onCancelEdit();
  };

  const handleDeleteCategoryWrapper = async (id: string) => {
    const success = await onDeleteCategory(id);
    if (success) {
      fetchCards();
    }
  };

  const handleOrganizeTrueFalse = async () => {
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
          onDeleteCategory={handleDeleteCategoryWrapper}
          onUpdateCategory={onUpdateCategory}
        />
        <Card>
          <CardHeader>
            <CardTitle>View Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="columns-slider">Columns: {columns}</Label>
              <div className="flex items-center gap-4">
                <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                <Slider
                  id="columns-slider"
                  value={[columns]}
                  onValueChange={(value) => setColumns(value[0])}
                  min={1}
                  max={3}
                  step={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deck Options</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              onClick={handleOrganizeTrueFalse}
              variant="secondary"
              className="w-full"
            >
              Organize 'True or False' Cards
            </Button>
            <div>
              <Button
                onClick={onResetProgress}
                variant="destructive"
                className="w-full"
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Progress & Stats
              </Button>
              <p className="text-xs text-muted-foreground mt-2">This will reset the status and guess statistics for all cards in this deck.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Import/Export</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ImportExport
              cards={cards}
              onBulkImport={onBulkImport}
              categories={categories}
              onAddCategory={onAddCategory}
            />
          </CardContent>
        </Card>
      </div>
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        <FlashcardForm
          onSave={handleSave}
          editingCard={editingCard}
          onCancel={onCancelEdit}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
        />
        <FlashcardList
          flashcards={filteredCards}
          onEdit={onEdit}
          onDelete={onDeleteCard}
          onOrganize={setOrganizingCard}
          columns={columns}
          rowHeight={120}
        />
      </div>
      <OrganizeCardModal
        card={organizingCard}
        categories={categories}
        isOpen={!!organizingCard}
        onClose={() => setOrganizingCard(null)}
        onUpdateCategory={onUpdateCardCategory}
      />
    </div>
  );
}