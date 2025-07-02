"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/components/flash-card";
import { ArrowLeft, ArrowRight, Star, Trash2, Shuffle, CheckCircle, Edit, RefreshCcw } from "lucide-react";
import { AddFlashCardForm } from "@/components/add-flash-card-form";
import { EditFlashCardForm } from "@/components/edit-flash-card-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CardData } from "@/hooks/use-flashcards";

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
  filterMode: 'all' | 'starred' | 'learned';
  setFilterMode: (mode: 'all' | 'starred' | 'learned') => void;
  onResetProgress: () => void;
  isCurrentRoomWritable: boolean;
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
  filterMode,
  setFilterMode,
  onResetProgress,
  isCurrentRoomWritable,
}: FlashCardDeckProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const dialogTitleId = useId();

  const currentCard = cards[currentCardIndex];
  const totalCards = cards.length;
  const masteredCards = cards.filter(card => card.status === 'mastered').length;
  const starredCards = cards.filter(card => card.starred).length;
  const seenCardsCount = cards.reduce((sum, card) => sum + card.seen_count, 0);
  const uniqueSeenCards = new Set(cards.filter(card => card.seen_count > 0).map(card => card.id)).size;


  const handleDeleteCurrentCard = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete flashcards in this room.");
      return;
    }
    if (currentCard) {
      onDeleteCard(currentCard.id);
    }
  };

  const handleToggleStarCurrentCard = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to star/unstar flashcards in this room.");
      return;
    }
    if (currentCard) {
      onToggleStar(currentCard.id);
    }
  };

  const handleMarkAsLearnedCurrentCard = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to mark flashcards as learned in this room.");
      return;
    }
    if (currentCard) {
      onMarkAsLearned(currentCard.id);
    }
  };

  const handleUpdateCurrentCard = (updatedData: { front: string; back: string }) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to update flashcards in this room.");
      return;
    }
    if (currentCard) {
      onUpdateCard(currentCard.id, updatedData);
      setIsEditDialogOpen(false);
    }
  };

  const handleShuffleCardsClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to shuffle flashcards in this room.");
      return;
    }
    onShuffleCards();
  };

  const handleResetProgressClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to reset flashcard progress in this room.");
      return;
    }
    onResetProgress();
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
            <Button onClick={handleToggleStarCurrentCard} variant="ghost" size="icon" className={cn(currentCard.starred && "text-yellow-500")} disabled={!isCurrentRoomWritable}>
              <Star className="h-5 w-5 fill-current" />
              <span className="sr-only">Toggle Star</span>
            </Button>
            <Button onClick={handleMarkAsLearnedCurrentCard} variant="ghost" size="icon" className={cn(currentCard.status === 'mastered' && "text-green-500")} disabled={!isCurrentRoomWritable}>
              <CheckCircle className="h-5 w-5 fill-current" />
              <span className="sr-only">Mark as Learned</span>
            </Button>
            <Button onClick={handleShuffleCardsClick} variant="ghost" size="icon" disabled={!isCurrentRoomWritable}>
              <Shuffle className="h-5 w-5" />
              <span className="sr-only">Shuffle Cards</span>
            </Button>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={totalCards === 0 || !isCurrentRoomWritable}>
                  <Edit className="h-5 w-5" />
                  <span className="sr-only">Edit Card</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" aria-labelledby={dialogTitleId}>
                <DialogHeader>
                  <DialogTitle id={dialogTitleId}>Edit Flashcard</DialogTitle>
                </DialogHeader>
                {currentCard && (
                  <EditFlashCardForm
                    initialData={{ front: currentCard.front, back: currentCard.back }}
                    onSave={handleUpdateCurrentCard}
                    onCancel={() => setIsEditDialogOpen(false)}
                    isCurrentRoomWritable={isCurrentRoomWritable}
                  />
                )}
              </DialogContent>
            </Dialog>
            <Button onClick={handleDeleteCurrentCard} variant="ghost" size="icon" className="text-red-500" disabled={!isCurrentRoomWritable}>
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Delete Card</span>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground flex flex-col items-center">
            <p>Card {currentCardIndex + 1} of {totalCards}</p>
            <p>{masteredCards} mastered, {starredCards} starred</p>
          </div>
          <div className="w-full text-center text-sm text-muted-foreground">
            <p>Progress: {totalCards > 0 ? ((uniqueSeenCards / totalCards) * 100).toFixed(0) : 0}% seen ({uniqueSeenCards}/{totalCards} unique cards)</p>
            <p>Total views: {seenCardsCount}</p>
            <p>Mastered: {totalCards > 0 ? ((masteredCards / totalCards) * 100).toFixed(0) : 0}%</p>
          </div>
        </>
      ) : (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle>No Flashcards Yet!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Add your first flashcard below.</p>
          </CardContent>
        </Card>
      )}

      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle>Add New Flashcard</CardTitle>
        </CardHeader>
        <CardContent>
          <AddFlashCardForm onAddCard={onAddCard} isCurrentRoomWritable={isCurrentRoomWritable} />
        </CardContent>
      </Card>

      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <h3 className="text-md font-semibold mb-2">View Filters</h3>
            <div className="flex gap-2">
              <Button
                variant={filterMode === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterMode('all')}
              >
                All Cards
              </Button>
              <Button
                variant={filterMode === 'starred' ? 'default' : 'outline'}
                onClick={() => setFilterMode('starred')}
              >
                Starred
              </Button>
              <Button
                variant={filterMode === 'learned' ? 'default' : 'outline'}
                onClick={() => setFilterMode('learned')}
              >
                Learned
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-2">Progress Tracking</h3>
            <Button onClick={handleResetProgressClick} variant="secondary" className="w-full" disabled={!isCurrentRoomWritable}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}