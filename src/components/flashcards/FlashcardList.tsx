"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardData, Category } from '@/hooks/flashcards/types';
import { FlashcardListItem } from './FlashcardListItem';
import { cn } from '@/lib/utils';

interface FlashcardListProps {
  flashcards: CardData[];
  onUpdate: (cardData: { id?: string; front: string; back: string; category_id?: string | null }) => void;
  onDelete: (id: string) => void;
  onOrganize: (card: CardData) => void;
  columns: number;
  // Removed rowHeight prop
  selectionMode: boolean;
  selectedCardIds: Set<string>;
  onToggleSelection: (id: string) => void;
  categories: Category[];
}

export function FlashcardList({
  flashcards,
  onUpdate,
  onDelete,
  onOrganize,
  columns,
  // Removed rowHeight from destructuring
  selectionMode,
  selectedCardIds,
  onToggleSelection,
  categories,
}: FlashcardListProps) {
  return (
    <Card className="w-full flex flex-col flex-1 bg-card backdrop-blur-xl border-white/20">
      <CardHeader className="p-2 sm:p-4">
        <CardTitle>Your Flashcards ({flashcards.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {flashcards.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm text-center">No flashcards yet. Use the form above to add your first flashcard!</p>
        ) : (
          <ScrollArea className="flex-1 h-full">
            <ul
              className={cn(
                "p-2 sm:p-4 grid gap-2 sm:gap-4",
                columns === 1 && "grid-cols-1",
                columns === 2 && "grid-cols-1 sm:grid-cols-2",
                columns === 3 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              )}
            >
              {flashcards.map((card) => (
                <FlashcardListItem
                  key={card.id}
                  card={card}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onOrganize={onOrganize}
                  // Removed rowHeight prop
                  isSelected={selectedCardIds.has(card.id)}
                  selectionMode={selectionMode}
                  onToggleSelection={onToggleSelection}
                  categories={categories}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}