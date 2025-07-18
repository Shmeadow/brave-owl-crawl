"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FolderCog } from 'lucide-react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { cn } from '@/lib/utils';
import { FlashcardForm } from './FlashcardForm';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FlashcardListItemProps {
  card: CardData;
  onUpdate: (cardData: { id?: string; front: string; back: string; category_id?: string | null }) => void;
  onDelete: (id: string) => void;
  onOrganize: (card: CardData) => void;
  // Removed rowHeight prop
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  categories: Category[];
}

export function FlashcardListItem({
  card,
  onUpdate,
  onDelete,
  onOrganize,
  // Removed rowHeight from destructuring
  selectionMode,
  isSelected,
  onToggleSelection,
  categories,
}: FlashcardListItemProps) {
  const [isEditingPopoverOpen, setIsEditingPopoverOpen] = useState(false);

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelection(card.id);
    }
  };

  const handleSaveEdit = (updatedData: { id?: string; front: string; back: string; category_id?: string | null }) => {
    onUpdate(updatedData);
    setIsEditingPopoverOpen(false);
  };

  return (
    <li
      className={cn(
        "group flex flex-col justify-between bg-muted backdrop-blur-xl p-3 sm:p-4 rounded-lg shadow-sm border border-border transition-all duration-200",
        selectionMode ? "cursor-pointer" : "hover:shadow-lg hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      // Removed style={{ minHeight: `${rowHeight}px` }}
    >
      <div className="flex-grow overflow-hidden mb-2 sm:mb-3">
        <p className="font-semibold text-foreground text-sm sm:text-base mb-2 break-words" title={card.front}>{card.front}</p>
        <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 break-words">{card.back}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 sm:pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Created: {new Date(card.created_at).toLocaleDateString()}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"> {/* Changed to flex-row for horizontal arrangement, added opacity for hover */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onOrganize(card); }}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Organize flashcard"
            disabled={selectionMode}
          >
            <FolderCog className="h-4 w-4" />
          </Button>
          <Popover open={isEditingPopoverOpen} onOpenChange={setIsEditingPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                title="Edit flashcard"
                disabled={selectionMode}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 z-[1100]"
              onClick={(e) => e.stopPropagation()}
              side="bottom"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <FlashcardForm
                editingCard={card}
                onSave={handleSaveEdit}
                onCancel={() => setIsEditingPopoverOpen(false)}
                categories={categories}
                selectedCategoryId={card.category_id ?? null}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Delete flashcard"
            disabled={selectionMode}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}