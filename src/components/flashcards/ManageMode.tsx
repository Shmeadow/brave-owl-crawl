"use client";

import React, { useState, useMemo } from 'react';
import { CategorySidebar } from './CategorySidebar';
import { FlashcardList } from './FlashcardList';
import { FlashcardForm } from './FlashcardForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, FolderInput, Trash, X, Upload, Download, Copy } from 'lucide-react'; // Added Upload, Download, Copy icons
import { CardData, Category } from '@/hooks/flashcards/types';
import { OrganizeCardModal } from './OrganizeCardModal';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useFlashcards } from '@/hooks/use-flashcards';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlashcardSize } from '@/hooks/use-flashcard-size';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Import Popover components
import { ImportFlashcardsContent } from './ImportFlashcardsContent'; // Import new components
import { ExportFlashcardsContent } from './ExportFlashcardsContent';
import { CopyFlashcardsContent } from './CopyFlashcardsContent';

interface ManageModeProps {
  cards: CardData[];
  onAddCard: (card: { front: string; back: string; category_id?: string | null }) => void;
  onDeleteCard: (id: string) => void;
  onUpdateCard: (cardData: { id?: string; front: string; back: string; category_id?: string | null }) => void;
  onBulkImport: (cards: { front: string; back: string }[], categoryId: string | null) => Promise<number>;
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category | null>;
  onDeleteCategory: (id: string, deleteContents: boolean) => Promise<boolean>;
  onUpdateCategory: (id: string, name: string) => void;
  onUpdateCardCategory: (cardId: string, newCategoryId: string | null) => void;
  flashcardSize: FlashcardSize;
  setFlashcardSize: (size: FlashcardSize) => void;
}

export function ManageMode({
  cards,
  onAddCard,
  onDeleteCard,
  onUpdateCard,
  onBulkImport,
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onUpdateCardCategory,
  flashcardSize,
  setFlashcardSize,
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

  // State for import/export/copy options
  const [colSep, setColSep] = useState(',');
  const [rowSep, setRowSep] = useState('\\n');
  const [customColSep, setCustomColSep] = useState('');
  const [customRowSep, setCustomRowSep] = useState('');

  const [isImportPopoverOpen, setIsImportPopoverOpen] = useState(false);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
  const [isCopyPopoverOpen, setIsCopyPopoverOpen] = useState(false);

  const filteredCards = useMemo(() => {
    if (selectedCategoryId === 'all') return cards;
    return cards.filter(card => card.category_id === selectedCategoryId);
  }, [cards, selectedCategoryId]);

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
          <CardHeader><CardTitle>Data Management</CardTitle></CardHeader>
          <CardContent className="p-4 flex flex-col gap-3">
            <Popover open={isImportPopoverOpen} onOpenChange={setIsImportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" /> Import
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 z-[1100] p-0 max-w-[calc(100vw-2rem)]" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                <ImportFlashcardsContent
                  onBulkImport={onBulkImport}
                  categories={categories}
                  onAddCategory={onAddCategory}
                  onClosePopover={() => setIsImportPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>

            <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Export File
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 z-[1100] p-0 max-w-[calc(100vw-2rem)]" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                <ExportFlashcardsContent
                  cards={cards}
                  colSep={colSep} setColSep={setColSep} customColSep={customColSep} setCustomColSep={setCustomColSep}
                  rowSep={rowSep} setRowSep={setRowSep} customRowSep={customRowSep} setCustomRowSep={setCustomRowSep}
                  onClosePopover={() => setIsExportPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>

            <Popover open={isCopyPopoverOpen} onOpenChange={setIsCopyPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" /> Copy Text
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 z-[1100] p-0 max-w-[calc(100vw-2rem)]" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                <CopyFlashcardsContent
                  cards={cards}
                  colSep={colSep} setColSep={setColSep} customColSep={customColSep} setCustomColSep={setCustomColSep}
                  rowSep={rowSep} setRowSep={setRowSep} customRowSep={customRowSep} setCustomRowSep={setCustomRowSep}
                  onClosePopover={() => setIsCopyPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        <FlashcardForm
          onSave={(cardData) => onAddCard(cardData)}
          editingCard={null}
          onCancel={() => {}}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
        />
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
        <FlashcardList
          flashcards={filteredCards}
          onUpdate={onUpdateCard}
          onDelete={onDeleteCard}
          onOrganize={setOrganizingCard}
          columns={columns}
          selectionMode={selectionMode}
          selectedCardIds={selectedCardIds}
          onToggleSelection={toggleSelection}
          categories={categories}
        />
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