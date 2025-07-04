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

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: (name: string) => Promise<Category | null>;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  isCurrentRoomWritable: boolean;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  isCurrentRoomWritable,
}: CategorySidebarProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

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

  return (
    <Card className="w-full md:w-1/3 flex flex-col bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={!isCurrentRoomWritable}
            />
            <Button onClick={handleAddCategory} size="icon" disabled={!isCurrentRoomWritable}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-left',
                selectedCategoryId === null && 'bg-accent text-accent-foreground'
              )}
              onClick={() => onSelectCategory(null)}
            >
              <Folder className="mr-2 h-4 w-4" /> Uncategorized
            </Button>
            {categories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent',
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
                    className="h-8"
                  />
                ) : (
                  <span className="flex-1 truncate">{category.name}</span>
                )}
                {isCurrentRoomWritable && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleStartEdit(category); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteCategory(category.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}