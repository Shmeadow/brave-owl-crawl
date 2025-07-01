"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Star, Lightbulb, Trash2, Shuffle, Edit, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardData } from "@/app/flash-cards/page";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlashCardDeckProps {
  cards: CardData[];
  currentCardIndex: number;
  isFlipped: boolean;
  onFlip: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onAddCard: (newCardData: { front: string; back: string }) => void;
  onDeleteCard: (cardId: string) => void;
  onShuffleCards: () => void;
  onToggleStar: (cardId: string) => void;
  onMarkAsLearned: (cardId: string) => void;
  onUpdateCard: (cardId: string, updatedData: { front: string; back: string }) => void;
  filterMode: 'all' | 'starred' | 'learned';
  setFilterMode: (mode: 'all' | 'starred' | 'learned') => void;
  onResetProgress: () => void;
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
}: FlashCardDeckProps) {
  const currentCard = cards[currentCardIndex];
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState("");
  const [editedBack, setEditedBack] = useState("");

  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");

  useEffect(() => {
    if (currentCard) {
      setEditedFront(currentCard.front);
      setEditedBack(currentCard.back);
    }
  }, [currentCard]);

  const handleEditSave = () => {
    if (currentCard && editedFront.trim() && editedBack.trim()) {
      onUpdateCard(currentCard.id, { front: editedFront, back: editedBack });
      setIsEditing(false);
    } else {
      toast.error("Both front and back of the card are required.");
    }
  };

  const handleAddNewCard = () => {
    if (newCardFront.trim() && newCardBack.trim()) {
      onAddCard({ front: newCardFront, back: newCardBack });
      setNewCardFront("");
      setNewCardBack("");
    } else {
      toast.error("Both front and back of the card are required.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl space-y-6">
      {cards.length > 0 ? (
        <>
          <Card className="w-full min-h-[250px] flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">
                {isFlipped ? "Back" : "Front"}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleStar(currentCard.id)}
                  className={cn(currentCard.starred ? "text-yellow-500" : "text-muted-foreground")}
                  title={currentCard.starred ? "Unstar card" : "Star card"}
                >
                  <Star className="h-5 w-5 fill-current" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  title="Edit card"
                >
                  <Edit className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteCard(currentCard.id)}
                  title="Delete card"
                >
                  <Trash2 className="h-5 w-5 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-6 text-center">
              {isFlipped ? (
                <p className="text-xl font-medium">{currentCard.back}</p>
              ) : (
                <p className="text-xl font-medium">{currentCard.front}</p>
              )}
            </CardContent>
            <div className="p-4 flex justify-between items-center border-t">
              <span className="text-sm text-muted-foreground">
                Card {currentCardIndex + 1} of {cards.length}
              </span>
              <Button onClick={onFlip} variant="outline">
                <Lightbulb className="mr-2 h-4 w-4" /> Flip Card
              </Button>
              <Button
                onClick={() => onMarkAsLearned(currentCard.id)}
                variant={currentCard.status === 'mastered' ? 'default' : 'secondary'}
              >
                {currentCard.status === 'mastered' ? "Mark as New" : "Mark as Learned"}
              </Button>
            </div>
          </Card>

          <div className="flex space-x-4">
            <Button onClick={onPrevious} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-5 w-5" /> Previous
            </Button>
            <Button onClick={onNext} size="lg">
              Next <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="flex space-x-2 mt-4">
            <Select value={filterMode} onValueChange={(value: 'all' | 'starred' | 'learned') => setFilterMode(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Cards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cards</SelectItem>
                <SelectItem value="starred">Starred Cards</SelectItem>
                <SelectItem value="learned">Learned Cards</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onShuffleCards} variant="outline">
              <Shuffle className="mr-2 h-4 w-4" /> Shuffle
            </Button>
            <Button onClick={onResetProgress} variant="destructive">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset All Progress
            </Button>
          </div>
        </>
      ) : (
        <Card className="w-full min-h-[200px] flex items-center justify-center">
          <CardContent className="text-center text-muted-foreground">
            No flashcards available. Add one below!
          </CardContent>
        </Card>
      )}

      {/* Add New Flashcard Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Add New Flashcard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Front of card"
            value={newCardFront}
            onChange={(e) => setNewCardFront(e.target.value)}
          />
          <Textarea
            placeholder="Back of card"
            value={newCardBack}
            onChange={(e) => setNewCardBack(e.target.value)}
          />
          <Button onClick={handleAddNewCard}>
            <Plus className="mr-2 h-4 w-4" /> Add Card
          </Button>
        </CardContent>
      </Card>

      {/* Edit Card Dialog */}
      {currentCard && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Flashcard</DialogTitle>
              <DialogDescription>
                Make changes to your flashcard here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="front" className="text-right">
                  Front
                </Label>
                <Input
                  id="front"
                  value={editedFront}
                  onChange={(e) => setEditedFront(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="back" className="text-right">
                  Back
                </Label>
                <Textarea
                  id="back"
                  value={editedBack}
                  onChange={(e) => setEditedBack(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleEditSave}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}