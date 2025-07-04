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
}

export function FlashcardList({ flashcards, onEdit, onDelete, onOrganize }: FlashcardListProps) {
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
            <ul className="p-4 space-y-2">
              {flashcards.map((card) => (
                <li key={card.id} className="flex items-center justify-between bg-muted backdrop-blur-xl p-2 rounded-md shadow-sm border border-border transition-all duration-200 hover:shadow-md">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-semibold text-foreground text-sm truncate" title={card.front}>{card.front}</p>
                    <p className="text-muted-foreground text-xs truncate" title={card.back}>{card.back}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mr-2">
                    <span className="capitalize">{card.status}</span>
                    <span>({card.seen_count})</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => onOrganize(card)}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-primary hover:bg-primary/10"
                      title="Organize flashcard"
                    >
                      <FolderCog className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => onEdit(card)}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-primary hover:bg-primary/10"
                      title="Edit flashcard"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => onDelete(card.id)}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      title="Delete flashcard"
                    >
                      <Trash2 className="h-4 w-4" />
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