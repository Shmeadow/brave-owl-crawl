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
  flashcardSize: FlashcardSize; // New prop
  setFlashcardSize: (size: FlashcardSize) => void; // New prop
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  flashcardSize, // Destructure new prop
  setFlashcardSize, // Destructure new prop
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
        <CardHeader className="p-4 pb-2"> {/* Reduced padding */}
          <CardTitle className="text-lg">Categories</CardTitle> {/* Reduced font size */}
        </CardHeader>
        <CardContent className="p-0 flex flex-col">
          <div className="p-2 border-b"> {/* Reduced padding */}
            <div className="flex gap-1"> {/* Reduced gap */}
              <Input
                placeholder="New category..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-8 text-sm" // Reduced height and font size
              />
              <Button onClick={handleAddCategory} size="icon" className="h-8 w-8"> {/* Reduced size */}
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[200px]"> {/* Reduced height */}
            <div className="p-1 space-y-0.5"> {/* Reduced padding and space-y */}
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left h-8 px-2 text-sm', // Reduced height, padding, font size
                  selectedCategoryId === 'all' && 'bg-accent text-accent-foreground'
                )}
                onClick={() => onSelectCategory('all')}
              >
                <Folder className="mr-2 h-4 w-4" /> All Cards
              </Button>
              {/* Removed explicit "Uncategorized" button */}
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent h-8 text-sm', // Reduced height, padding, font size
                    selectedCategoryId === category.id && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => onSelectCategory(category.id)}
                >
                  {editingCategoryId === category.id ? (
                    <Input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      autoFocus
                      className="h-7 text-sm" // Reduced height and font size
                    />
                  ) : (
                    <span className="flex-1 truncate">{category.name}</span>
                  )}
                  <div className="flex gap-0.5"> {/* Reduced gap */}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleStartEdit(category); }}>
                      <Edit className="h-3.5 w-3.5" /> {/* Reduced icon size */}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingCategory(category); }}>
                      <Trash2 className="h-3.5 w-3.5" /> {/* Reduced icon size */}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Removed Card Display Size section from here */}

      <DeleteCategoryDialog
        category={deletingCategory}
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}