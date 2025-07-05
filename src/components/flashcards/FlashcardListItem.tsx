"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, FolderCog } from 'lucide-react';
import { CardData } from '@/hooks/use-flashcards';
import { cn } from '@/lib/utils';

interface FlashcardListItemProps {
  card: CardData;
  onEdit: (card: CardData) => void;
  onDelete: (id: string) => void;
  onOrganize: (card: CardData) => void;
  rowHeight: number;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}

export function FlashcardListItem({
  card,
  onEdit,
  onDelete,
  onOrganize,
  rowHeight,
  selectionMode,
  isSelected,
  onToggleSelection,
}: FlashcardListItemProps) {
  const handleClick = () => {
    if (selectionMode) {
      onToggleSelection(card.id);
    }
  };

  return (
    <li
      className={cn(
        "flex flex-col justify-between bg-muted backdrop-blur-xl p-4 rounded-lg shadow-sm border border-border transition-all duration-200",
        selectionMode ? "cursor-pointer" : "hover:shadow-lg hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      style={{ minHeight: `${rowHeight}px` }}
      onClick={handleClick}
    >
      <div className="flex-grow overflow-hidden mb-3">
        <p className="font-semibold text-foreground text-base mb-2 truncate" title={card.front}>{card.front}</p>
        <p className="text-muted-foreground text-sm line-clamp-3">{card.back}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Created: {new Date(card.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-1">
          <Button
            onClick={(e) => { e.stopPropagation(); onOrganize(card); }}
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Organize flashcard"
            disabled={selectionMode}
          >
            <FolderCog className="h-4 w-4" />
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); onEdit(card); }}
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Edit flashcard"
            disabled={selectionMode}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
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