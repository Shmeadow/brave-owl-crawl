"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardData } from '@/hooks/use-flashcards';
import { FlashcardListItem } from './FlashcardListItem';

interface FlashcardListProps {
  flashcards: CardData[];
  onEdit: (card: CardData) => void;
  onDelete: (id: string) => void;
  onOrganize: (card: CardData) => void;
  columns: number;
  rowHeight: number;
}

export function FlashcardList({ flashcards, onEdit, onDelete, onOrganize, columns, rowHeight }: FlashcardListProps) {
  return (
    <Card className="w-full flex flex-col flex-1 bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Your Flashcards ({flashcards.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {flashcards.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm text-center">No flashcards yet. Use the form above to add your first flashcard!</p>
        ) : (
          <ScrollArea className="flex-1 h-full">
            <ul
              className="p-4 grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {flashcards.map((card) => (
                <FlashcardListItem
                  key={card.id}
                  card={card}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOrganize={onOrganize}
                  rowHeight={rowHeight}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}