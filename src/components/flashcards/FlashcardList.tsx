"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardData } from '@/hooks/use-flashcards';
import { FlashcardListItem } from './FlashcardListItem';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { LayoutGrid, Rows3 } from 'lucide-react';

interface FlashcardListProps {
  flashcards: CardData[];
  onEdit: (card: CardData) => void;
  onDelete: (id: string) => void;
  onOrganize: (card: CardData) => void;
  columns: number;
  setColumns: (value: number) => void;
  rowHeight: number;
  setRowHeight: (value: number) => void;
}

export function FlashcardList({
  flashcards,
  onEdit,
  onDelete,
  onOrganize,
  columns,
  setColumns,
  rowHeight,
  setRowHeight,
}: FlashcardListProps) {
  return (
    <Card className="w-full flex flex-col flex-1 bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Your Flashcards ({flashcards.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div className="space-y-2">
            <Label htmlFor="columns-slider">Columns: {columns}</Label>
            <div className="flex items-center gap-4">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              <Slider
                id="columns-slider"
                value={[columns]}
                onValueChange={(value) => setColumns(value[0])}
                min={1}
                max={3}
                step={1}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rows-slider">Card Height: {rowHeight}px</Label>
            <div className="flex items-center gap-4">
              <Rows3 className="h-5 w-5 text-muted-foreground" />
              <Slider
                id="rows-slider"
                value={[rowHeight]}
                onValueChange={(value) => setRowHeight(value[0])}
                min={60}
                max={240}
                step={10}
              />
            </div>
          </div>
        </div>
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