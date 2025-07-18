"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, Edit, Folder } from 'lucide-react';
import { Category } from '@/hooks/flashcards/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';
import { Label } from '@/components/ui/label'; // Import Label
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'; // Import ToggleGroup
import { FlashcardSize } from '@/hooks/use-flashcard-size'; // Import FlashcardSize type

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string | 'all' | null;
  onSelectCategory: (id: string | 'all' | null) => void;
  onAddCategory: (name: string) => Promise<Category | null>;
  onDeleteCategory: (id: string, deleteContents: boolean) => void;
  onUpdateCategory: (id: string, name: string) => void;
  // Removed flashcardSize and setFlashcardSize props
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  // Removed flashcardSize and setFlashcardSize from destructuring
}: CategorySidebarProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name cannot be empty.');
      return;
    }
    const newCategory = await onAddCategory(newCategoryName.trim());
    if (newCategory) {
      setNewCategoryName('');
      onSelectCategory(newCategory.id);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleSaveEdit = () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    onUpdateCategory(editingCategoryId, editingCategoryName.trim());
    handleCancelEdit();
  };

  const handleDeleteConfirm = async (categoryId: string, deleteContents: boolean) => {
    await onDeleteCategory(categoryId, deleteContents);
    setDeletingCategory(null);
  };

  return (
    <>
      <Card className="w-full flex flex-col bg-card backdrop-blur-xl border-white/20">
        <CardHeader className="p-2 sm:p-4">
          <CardTitle className="text-base">Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col">
          <div className="p-2 sm:p-4 border-b">
            <div className="flex gap-2">
              <Input
                id="new-category-name-input" // Added ID here
                placeholder="New category..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-9 text-sm"
              />
              <Button onClick={handleAddCategory} size="icon" className="h-9 w-9 flex-shrink-0">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[250px]">
            <div className="p-2 sm:p-4 pt-0 space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left h-9 px-2 sm:px-4 text-sm',
                  selectedCategoryId === 'all' && 'bg-accent text-accent-foreground'
                )}
                onClick={() => onSelectCategory('all')}
              >
                <Folder className="mr-2 h-4 w-4" /> All Cards
              </Button>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent h-9 text-sm',
                    selectedCategoryId === category.id && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => onSelectCategory(category.id)}
                >
                  {editingCategoryId === category.id ? (
                    <Input
                      id="edit-category-name-input" // Added ID here
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      autoFocus
                      className="h-8 text-sm"
                    />
                  ) : (
                    <span className="flex-1 truncate">{category.name}</span>
                  )}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleStartEdit(category); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingCategory(category); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <DeleteCategoryDialog
        category={deletingCategory}
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}