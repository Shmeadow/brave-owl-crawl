"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2 } from 'lucide-react';
import { CardData } from '@/hooks/use-flashcards';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

interface FlashcardListProps {
  flashcards: CardData[];
  onEdit: (card: CardData) => void;
  onDelete: (id: string) => void;
  isCurrentRoomWritable: boolean;
  session: Session | null;
}

export function FlashcardList({ flashcards, onEdit, onDelete, isCurrentRoomWritable, session }: FlashcardListProps) {
  const handleDeleteClick = (id: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete flashcards in this room.");
      return;
    }
    onDelete(id);
  };

  const handleEditClick = (card: CardData) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit flashcards in this room.");
      return;
    }
    onEdit(card);
  };

  const getOwnerDisplay = (cardUserId?: string) => {
    if (!cardUserId) return 'Local';
    if (session?.user?.id === cardUserId) return 'You';
    return `User (${cardUserId.substring(0, 6)}...)`;
  };

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
            <ul className="p-4 space-y-4">
              {flashcards.map((card) => (
                <li key={card.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted backdrop-blur-xl p-4 rounded-md shadow-sm border border-border transition-all duration-200 hover:shadow-md">
                  <div className="flex-1 mb-3 sm:mb-0 sm:mr-4">
                    <p className="font-semibold text-foreground text-lg mb-1">{card.front}</p>
                    <p className="text-muted-foreground text-sm">{card.back}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Status: <span className="capitalize">{card.status}</span> | Seen: {card.seen_count} | Owner: {getOwnerDisplay(card.user_id)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditClick(card)}
                      size="icon"
                      variant="ghost"
                      className="text-primary hover:bg-primary/10"
                      title="Edit flashcard"
                      disabled={!isCurrentRoomWritable}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(card.id)}
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      title="Delete flashcard"
                      disabled={!isCurrentRoomWritable}
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