"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/components/flash-card";
import { ArrowLeft, ArrowRight, Star, Trash2, Shuffle, CheckCircle, Edit } from "lucide-react";
import { AddFlashCardForm } from "@/components/add-flash-card-form";
import { EditFlashCardForm } from "@/components/edit-flash-card-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CardData {
  id: string;
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learned';
  seen: boolean;
}

interface FlashCardDeckProps {
  cards: CardData[];
  currentCardIndex: number;
  isFlipped: boolean;
  onFlip: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onAddCard: (card: { front: string; back: string }) => void;
  onDeleteCard: (cardId: string) => void;
  onShuffleCards: () => void;
  onToggleStar: (cardId: string) => void;
  onMarkAsLearned: (cardId: string) => void;
  onUpdateCard: (cardId: string, updatedData: { front: string; back: string }) => void;
}

export function FlashCardDeck({
  cards,
  currentCardIndex,
  isFlipped,
  onFlip,
  onNext,
  onPrevious,
  onAddCard,
  onDeleteCard,
  onShuffleCards,
  onToggleStar,
  onMarkAsLearned,
  onUpdateCard,
}: FlashCardDeckProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const currentCard = cards[currentCardIndex];
  const totalCards = cards.length;
  const learnedCards = cards.filter(card => card.status === 'learned').length;
  const starredCards = cards.filter(card => card.starred).length;
  const seenCards = cards.filter(card => card.seen).length;

  const handleDeleteCurrentCard = () => {
    if (currentCard) {
      onDeleteCard(currentCard.id);
    }
  };

  const handleToggleStarCurrentCard = () => {
    if (currentCard) {
      onToggleStar(currentCard.id);
    }
  };

  const handleMarkAsLearnedCurrentCard = () => {
    if (currentCard) {
      onMarkAsLearned(currentCard.id);
    }
  };

  const handleUpdateCurrentCard = (updatedData: { front: string; back: string }) => {
    if (currentCard) {
      onUpdateCard(currentCard.id, updatedData);
      setIsEditDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      {totalCards > 0 ? (
        <>
          <FlashCard
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isFlipped}
            onClick={onFlip}
          />
          <div className="flex gap-2 w-full justify-center">
            <Button onClick={onPrevious} variant="outline" disabled={totalCards <= 1}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={onNext} disabled={totalCards <= 0}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 w-full justify-center">
            <Button onClick={handleToggleStarCurrentCard} variant="ghost" size="icon" className={cn(currentCard.starred && "text-yellow-500")}>
              <Star className="h-5 w-5 fill-current" />
              <span className="sr-only">Toggle Star</span>
            </Button>
            <Button onClick={handleMarkAsLearnedCurrentCard} variant="ghost" size="icon" className={cn(currentCard.status === 'learned' && "text-green-500")}>
              <CheckCircle className="h-5 w-5 fill-current" />
              <span className="sr-only">Mark as Learned</span>
            </Button>
            <Button onClick={onShuffleCards} variant="ghost" size="icon">
              <Shuffle className="h-5 w-5" />
              <span className="sr-only">Shuffle Cards</span>
            </Button>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={totalCards === 0}>
                  <Edit className="h-5 w-5" />
                  <span className="sr-only">Edit Card</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" aria-labelledby="edit-flashcard-title-deck">
                <DialogHeader>
                  <DialogTitle id="edit-flashcard-title-deck">Edit Flashcard</DialogTitle>
                </DialogHeader>
                {currentCard && (
                  <EditFlashCardForm
                    initialData={{ front: currentCard.front, back: currentCard.back }}
                    onSave={handleUpdateCurrentCard}
                    onCancel={() => setIsEditDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
            <Button onClick={handleDeleteCurrentCard} variant="ghost" size="icon" className="text-red-500">
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Delete Card</span>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground flex flex-col items-center">
            <p>Card {currentCardIndex + 1} of {totalCards}</p>
            <p>{learnedCards} learned, {starredCards} starred</p>
          </div>
          {/* Progress display */}
          <div className="w-full text-center text-sm text-muted-foreground">
            <p>Progress: {totalCards > 0 ? ((seenCards / totalCards) * 100).toFixed(0) : 0}% seen</p>
            <p>Learned: {totalCards > 0 ? ((learnedCards / totalCards) * 100).toFixed(0) : 0}%</p>
          </div>
        </>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Flashcards Yet!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Add your first flashcard below.</p>
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Add New Flashcard</CardTitle>
        </CardHeader>
        <CardContent>
          <AddFlashCardForm onAddCard={onAddCard} />
        </CardContent>
      </Card>
    </div>
  );
}