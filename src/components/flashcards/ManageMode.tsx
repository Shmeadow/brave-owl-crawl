"use client";

import React, { useState, useMemo } from 'react';
import { CategorySidebar } from './CategorySidebar';
import { FlashcardList } from './FlashcardList';
import { FlashcardForm } from './FlashcardForm';
import { ImportExport } from './ImportExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, LayoutGrid, FolderInput, Trash, X } from 'lucide-react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { OrganizeCardModal } from './OrganizeCardModal';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useFlashcards } from '@/hooks/use-flashcards';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  onDeleteCategory: (id: string, deleteContents: boolean) => Promise<boolean>;
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
  const { fetchCards, handleBulkDelete, handleBulkMove } = useFlashcards();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all' | null>('all');
  const [organizingCard, setOrganizingCard] = useState<CardData | null>(null);
  const [columns, setColumns] = useState(3);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkMoveCategoryId, setBulkMoveCategoryId] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    if (selectedCategoryId === 'all') return cards;
    return cards.filter(card => card.category_id === selectedCategoryId);
  }, [cards, selectedCategoryId]);

  const handleSave = async (cardData: { id?: string; front: string; back: string; category_id?: string | null }) => {
    if (cardData.id) onUpdateCard(cardData.id, cardData);
    else onAddCard(cardData);
    onCancelEdit();
  };

  const handleDeleteCategoryWrapper = async (id: string, deleteContents: boolean) => {
    const success = await onDeleteCategory(id, deleteContents);
    if (success) fetchCards();
  };

  const toggleSelection = (cardId: string) => {
    setSelectedCardIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) newSet.delete(cardId);
      else newSet.add(cardId);
      return newSet;
    });
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedCardIds(new Set());
  };

  const handleConfirmBulkDelete = async () => {
    await handleBulkDelete(Array.from(selectedCardIds));
    setIsBulkDeleteOpen(false);
    handleToggleSelectionMode();
  };

  const handleConfirmBulkMove = async () => {
    await handleBulkMove(Array.from(selectedCardIds), bulkMoveCategoryId);
    setIsBulkMoveOpen(false);
    handleToggleSelectionMode();
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
          <CardHeader><CardTitle>View Options</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="columns-slider">Columns: {columns}</Label>
              <div className="flex items-center gap-4">
                <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                <Slider id="columns-slider" value={[columns]} onValueChange={(v) => setColumns(v[0])} min={1} max={3} step={1} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deck Options</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={onResetProgress} variant="destructive" className="w-full">
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Progress
            </Button>
            <p className="text-xs text-muted-foreground mt-2">This resets status and guess stats for all cards.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Import/Export</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ImportExport cards={cards} onBulkImport={onBulkImport} categories={categories} onAddCategory={onAddCategory} />
          </CardContent>
        </Card>
      </div>
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        <FlashcardForm onSave={handleSave} editingCard={editingCard} onCancel={onCancelEdit} categories={categories} selectedCategoryId={selectedCategoryId} />
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Flashcards ({filteredCards.length})</h2>
          {selectionMode ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedCardIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={() => setIsBulkMoveOpen(true)} disabled={selectedCardIds.size === 0}><FolderInput className="mr-2 h-4 w-4" /> Move</Button>
              <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)} disabled={selectedCardIds.size === 0}><Trash className="mr-2 h-4 w-4" /> Delete</Button>
              <Button variant="ghost" size="icon" onClick={handleToggleSelectionMode}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <Button variant="outline" onClick={handleToggleSelectionMode}>Select Cards</Button>
          )}
        </div>
        <FlashcardList flashcards={filteredCards} onEdit={onEdit} onDelete={onDeleteCard} onOrganize={setOrganizingCard} columns={columns} rowHeight={120} selectionMode={selectionMode} selectedCardIds={selectedCardIds} onToggleSelection={toggleSelection} />
      </div>
      <OrganizeCardModal card={organizingCard} categories={categories} isOpen={!!organizingCard} onClose={() => setOrganizingCard(null)} onUpdateCategory={onUpdateCardCategory} />
      <Dialog open={isBulkMoveOpen} onOpenChange={setIsBulkMoveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move {selectedCardIds.size} Cards</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Move to Category</Label>
            <Select onValueChange={(value) => setBulkMoveCategoryId(value === 'null' ? null : value)} defaultValue="null">
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Uncategorized</SelectItem>
                {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkMoveOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmBulkMove}>Move Cards</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Are you sure?</DialogTitle><DialogDescription>This will permanently delete {selectedCardIds.size} selected flashcards. This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmBulkDelete}>Delete Cards</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}