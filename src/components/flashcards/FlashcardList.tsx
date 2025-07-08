"use client";

import React from "react";
import { FlashcardListItem } from "./FlashcardListItem";
import { CardData } from "@/hooks/use-flashcards";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FlashcardListProps {
  flashcards: CardData[];
  selectionMode: boolean;
  selectedCards: Set<string>;
  onCardSelect: (cardId: string) => void;
  onEdit: (card: CardData) => void;
  onDelete: (cardId: string) => void;
  isCurrentRoomWritable: boolean;
}

export function FlashcardList({
  flashcards,
  selectionMode,
  selectedCards,
  onCardSelect,
  onEdit,
  onDelete,
  isCurrentRoomWritable,
}: FlashcardListProps) {
  return (
    <Card className="w-full flex flex-col flex-1 bg-card/40 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Your Flashcards</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {flashcards.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm text-center">No flashcards found. Create one to get started!</p>
        ) : (
          <ScrollArea className="flex-1 h-full">
            <ul className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {flashcards.map((card) => (
                <FlashcardListItem
                  key={card.id}
                  card={card}
                  selectionMode={selectionMode}
                  isSelected={selectedCards.has(card.id)}
                  onSelect={onCardSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isCurrentRoomWritable={isCurrentRoomWritable}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}