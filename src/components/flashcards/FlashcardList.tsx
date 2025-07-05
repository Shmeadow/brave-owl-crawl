"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardData } from '@/hooks/flashcards/types';
import { FlashcardListItem } from './FlashcardListItem';

interface FlashcardListProps {
  flashcards: CardData[];
  onEdit: (card: CardData) => void;
  onDelete: (id: string) => void;
  selectionMode: boolean;
  selectedCardIds: Set<string>;
  onToggleSelection: (id: string) => void;
}

export function FlashcardList({
  flashcards,
  onEdit,
  onDelete,
  selectionMode,
  selectedCardIds,
  onToggleSelection,
}: FlashcardListProps) {
  return (
    <>
      {flashcards.length === 0 ? (
        <p className="p-8 text-muted-foreground text-sm text-center">No flashcards in this category.</p>
      ) : (
        <ScrollArea className="flex-1 h-[500px]">
          <ul className="p-4 space-y-3">
            {flashcards.map((card) => (
              <FlashcardListItem
                key={card.id}
                card={card}
                onEdit={onEdit}
                onDelete={onDelete}
                selectionMode={selectionMode || selectedCardIds.has(card.id)}
                isSelected={selectedCardIds.has(card.id)}
                onToggleSelect={onToggleSelection}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
    </>
  );
}