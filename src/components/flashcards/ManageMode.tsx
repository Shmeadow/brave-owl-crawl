"use client";

import React, { useState, useMemo } from 'react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Move, MoreVertical, Upload, RefreshCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CategorySidebar } from './CategorySidebar';
import { FlashcardList } from './FlashcardList';
import { AddFlashCardForm } from '../add-flash-card-form';
import { EditFlashCardForm } from '../edit-flash-card-form';
import { ImportExport } from './ImportExport';

interface ManageModeProps {
  cards: CardData[];
  editingCard: CardData | null;
  onAddCard: (data: { front: string; back: string; category_id?: string | null }) => void;
  onUpdateCard: (id: string, data: { front: string; back: string; category_id?: string | null }) => void;
  onDeleteCard: (id: string) => void;
  onEdit: (card: CardData) => void;
  onCancelEdit: () => void;
  onResetProgress: () => void;
  onBulkImport: (newCards: { front: string; back: string }[], categoryId: string | null) => Promise<number>;
  onBulkDelete: (cardIds: string[]) => void;
  onBulkMove: (cardIds: string[], newCategoryId: string | null) => void;
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category | null>;
  onDeleteCategory: (id: string, deleteContents: boolean) => void;
  onUpdateCategory: (id: string, name: string) => void;
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
  onBulkDelete,
  onBulkMove,
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
}: ManageModeProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [targetMoveCategoryId, setTargetMoveCategoryId] = useState<string>('');

  const selectionMode = selectedCardIds.size > 0;

  const filteredCards = useMemo(() => {
    if (selectedCategoryId === 'all') return cards;
    return cards.filter(card => card.category_id === selectedCategoryId);
  }, [cards, selectedCategoryId]);

  const handleToggleSelection = (id: string) => {
    setSelectedCardIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCardIds.size === filteredCards.length) {
      setSelectedCardIds(new Set());
    } else {
      setSelectedCardIds(new Set(filteredCards.map(c => c.id)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectionMode) {
      onBulkDelete(Array.from(selectedCardIds));
      setSelectedCardIds(new Set());
    }
  };

  const handleBulkMoveClick = () => {
    if (selectionMode && targetMoveCategoryId) {
      onBulkMove(Array.from(selectedCardIds), targetMoveCategoryId === 'none' ? null : targetMoveCategoryId);
      setSelectedCardIds(new Set());
    }
  };

  const handleAddCardSubmit = (data: { front: string; back: string }) => {
    onAddCard({ ...data, category_id: selectedCategoryId === 'all' ? null : selectedCategoryId });
    setIsAddDialogOpen(false);
  };

  const handleUpdateCardSubmit = (data: { front: string; back: string }) => {
    if (editingCard) {
      onUpdateCard(editingCard.id, { ...data, category_id: editingCard.category_id });
      onCancelEdit();
    }
  };

  return (
    <div className="grid md:grid-cols-12 gap-6 w-full">
      <div className="md:col-span-4 lg:col-span-3">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
          onUpdateCategory={onUpdateCategory}
        />
      </div>

      <div className="md:col-span-8 lg:col-span-9">
        <Card className="w-full flex flex-col flex-1 bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>
                {selectedCategoryId === 'all' ? 'All Cards' : categories.find(c => c.id === selectedCategoryId)?.name || 'Category'} ({filteredCards.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Card
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsImportExportOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" /> Import / Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onResetProgress} className="text-destructive">
                      <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Progress
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {selectionMode && (
              <div className="mt-4 p-2 bg-muted rounded-lg flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{selectedCardIds.size} cards selected</span>
                <div className="flex items-center gap-2">
                  <Select onValueChange={setTargetMoveCategoryId}>
                    <SelectTrigger className="h-8 w-[150px]">
                      <SelectValue placeholder="Move to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleBulkMoveClick} size="sm" variant="outline" disabled={!targetMoveCategoryId}>
                    <Move className="mr-2 h-4 w-4" /> Move
                  </Button>
                  <Button onClick={handleBulkDeleteClick} size="sm" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            <FlashcardList
              flashcards={filteredCards}
              onEdit={onEdit}
              onDelete={onDeleteCard}
              selectionMode={selectionMode}
              selectedCardIds={selectedCardIds}
              onToggleSelection={handleToggleSelection}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Flashcard</DialogTitle></DialogHeader>
          <AddFlashCardForm onAddCard={handleAddCardSubmit} isCurrentRoomWritable={true} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCard} onOpenChange={(open) => !open && onCancelEdit()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Flashcard</DialogTitle></DialogHeader>
          {editingCard && (
            <EditFlashCardForm
              initialData={{ front: editingCard.front, back: editingCard.back }}
              onSave={handleUpdateCardSubmit}
              onCancel={onCancelEdit}
              isCurrentRoomWritable={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isImportExportOpen} onOpenChange={setIsImportExportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import & Export</DialogTitle></DialogHeader>
          <ImportExport
            cards={cards}
            onBulkImport={onBulkImport}
            categories={categories}
            onAddCategory={onAddCategory}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}