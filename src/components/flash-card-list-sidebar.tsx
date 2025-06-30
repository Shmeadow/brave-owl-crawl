"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Star, CheckCircle, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditFlashCardForm } from "@/components/edit-flash-card-form";

interface CardData {
  id: string;
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learned';
  seen: boolean;
}

interface FlashCardListSidebarProps {
  cards: CardData[];
  currentCardIndex: number;
  onSelectCard: (index: number) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, updatedData: { front: string; back: string }) => void;
  onToggleStar: (cardId: string) => void;
  onMarkAsLearned: (cardId: string) => void;
}

export function FlashCardListSidebar({
  cards,
  currentCardIndex,
  onSelectCard,
  onDeleteCard,
  onUpdateCard,
  onToggleStar,
  onMarkAsLearned,
}: FlashCardListSidebarProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const handleEditClick = (card: CardData) => {
    setEditingCardId(card.id);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedData: { front: string; back: string }) => {
    if (editingCardId) {
      onUpdateCard(editingCardId, updatedData);
      setIsEditDialogOpen(false);
      setEditingCardId(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingCardId(null);
  };

  const currentEditingCard = cards.find(card => card.id === editingCardId);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Your Flashcards</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {cards.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm">No flashcards added yet.</p>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="p-4 space-y-2">
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    index === currentCardIndex && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  )}
                  onClick={() => onSelectCard(index)}
                >
                  <div className="flex-1 truncate pr-2">
                    <p className="font-medium text-sm">{card.front}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {card.starred && <Star className={cn("h-3 w-3", index === currentCardIndex ? "text-yellow-300" : "text-yellow-500")} fill="currentColor" />}
                      {card.status === 'learned' && <CheckCircle className={cn("h-3 w-3", index === currentCardIndex ? "text-green-300" : "text-green-500")} fill="currentColor" />}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-7 w-7", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
                      onClick={(e) => { e.stopPropagation(); onToggleStar(card.id); }}
                    >
                      <Star className={cn("h-4 w-4", card.starred && (index === currentCardIndex ? "text-yellow-300" : "text-yellow-500"))} fill="currentColor" />
                      <span className="sr-only">Toggle Star</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-7 w-7", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
                      onClick={(e) => { e.stopPropagation(); onMarkAsLearned(card.id); }}
                    >
                      <CheckCircle className={cn("h-4 w-4", card.status === 'learned' && (index === currentCardIndex ? "text-green-300" : "text-green-500"))} fill="currentColor" />
                      <span className="sr-only">Mark as Learned</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-7 w-7", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
                      onClick={(e) => { e.stopPropagation(); handleEditClick(card); }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Card</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-7 w-7", index === currentCardIndex ? "text-red-300 hover:bg-primary/80" : "text-red-500 hover:bg-accent")}
                      onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Card</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
          </DialogHeader>
          {currentEditingCard && (
            <EditFlashCardForm
              initialData={{ front: currentEditingCard.front, back: currentEditingCard.back }}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}