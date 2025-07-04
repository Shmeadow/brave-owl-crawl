"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2, FolderCog } from 'lucide-react';
import { CardData } from '@/hooks/use-flashcards';
import { toast } from 'sonner';

interface FlashcardListProps {
  flashcards: CardData[];
  onEdit: (card: CardData) => void;
  onDelete: (id: string) => void;
  onOrganize: (card: CardData) => void;
  columns: number;
}

export function FlashcardList({ flashcards, onEdit, onDelete, onOrganize, columns }: FlashcardListProps) {
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
                <li key={card.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted backdrop-blur-xl p-4 rounded-md shadow-sm border border-border transition-all duration-200 hover:shadow-md">
                  <div className="flex-1 mb-3 sm:mb-0 sm:mr-4">
                    <p className="font-semibold text-foreground text-lg mb-1">{card.front}</p>
                    <p className="text-muted-foreground text-sm">{card.back}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Status: <span className="capitalize">{card.status}</span> | Seen: {card.seen_count}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onOrganize(card)}
                      size="icon"
                      variant="ghost"
                      className="text-primary hover:bg-primary/10"
                      title="Organize flashcard"
                    >
                      <FolderCog className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => onEdit(card)}
                      size="icon"
                      variant="ghost"
                      className="text-primary hover:bg-primary/10"
                      title="Edit flashcard"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => onDelete(card.id)}
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      title="Delete flashcard"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}