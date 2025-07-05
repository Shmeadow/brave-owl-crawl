"use client";

import React from 'react';
import { CardData } from '@/hooks/flashcards/types';
import { Button } from '@/components/ui/button';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface FlashcardListItemProps {
  card: CardData;
  onEdit: (card: CardData) => void;
  onDelete: (id: string) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOrganize?: (card: CardData) => void;
  rowHeight?: number; // Fix: Add optional prop
}

export const FlashcardListItem: React.FC<FlashcardListItemProps> = ({
  card,
  onEdit,
  onDelete,
  selectionMode,
  isSelected,
  onToggleSelect,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click from propagating to buttons inside
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (selectionMode) {
      onToggleSelect(card.id);
    }
  };

  return (
    <li
      className={cn(
        "flex flex-col justify-between bg-muted/50 backdrop-blur-xl p-4 rounded-lg shadow-sm border border-border transition-all duration-200",
        selectionMode ? "cursor-pointer" : "hover:shadow-md hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={handleCardClick}
    >
      <div className="flex-grow flex justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-foreground">{card.front}</p>
          <p className="text-sm text-muted-foreground mt-1">{card.back}</p>
        </div>
        <div className="flex items-start gap-2">
          {card.starred && <Star className="h-5 w-5 text-yellow-400 fill-current" />}
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(card.id)}
              aria-label={`Select card ${card.front}`}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-4 pt-2 border-t border-border/50">
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {card.status}
          </Badge>
          <span>Seen: {card.seen_count}</span>
          <span className="text-green-500">Correct: {card.correct_guesses}</span>
          <span className="text-red-500">Incorrect: {card.incorrect_guesses}</span>
        </div>
        
        {!selectionMode && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(card)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(card.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )}
      </div>
    </li>
  );
};