"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Repeat, Shuffle, Flag } from 'lucide-react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { toast } from 'sonner';
import { FlashCard } from '@/components/flash-card';
import { useFlashcardCategories } from '@/hooks/flashcards/useFlashcardCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // Import Label
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'; // Import ToggleGroup
import { FlashcardSize } from '@/hooks/use-flashcard-size'; // Import type

interface LearnModeProps {
  flashcards: CardData[];
  onGradeCard: (cardId: string, grade: 'Easy' | 'Good' | 'Hard' | 'Again') => void;
  goToSummary: () => void;
  flashcardSize: FlashcardSize; // Add new prop
  setFlashcardSize: (size: FlashcardSize) => void; // New prop
}

export function LearnMode({ flashcards, onGradeCard, goToSummary, flashcardSize, setFlashcardSize }: LearnModeProps) {
  const { categories } = useFlashcardCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [activeCards, setActiveCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const filtered = selectedCategoryId === 'all'
      ? flashcards
      : flashcards.filter(c => c.category_id === selectedCategoryId);
    setActiveCards(filtered);
  }, [flashcards, selectedCategoryId]);

  useEffect(() => {
    if (activeCards.length > 0) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  }, [activeCards]);

  const currentCardData = activeCards[currentIndex];

  const handleShuffle = () => {
    if (activeCards.length > 1) {
      const shuffled = [...activeCards].sort(() => Math.random() - 0.5);
      setActiveCards(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      toast.success("Cards shuffled!");
    }
  };

  const handleNext = () => {
    if (activeCards.length === 0) return;
    const nextIndex = (currentIndex + 1) % activeCards.length;
    setCurrentIndex(nextIndex);
    setIsFlipped(false);
  };

  const handleBack = () => {
    if (activeCards.length === 0) return;
    const prevIndex = (currentIndex - 1 + activeCards.length) % activeCards.length;
    setCurrentIndex(prevIndex);
    setIsFlipped(false);
  };

  const handleGradeAndProceed = (grade: 'Easy' | 'Good' | 'Hard' | 'Again') => {
    if (!currentCardData) return;
    onGradeCard(currentCardData.id, grade);
    handleNext();
  };

  if (flashcards.length === 0) {
    return <Card className="text-center p-8"><CardContent>No flashcards to learn! Add some in "Manage Deck".</CardContent></Card>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6 w-full">
      <Card className="w-full md:w-1/4">
        <CardContent className="p-2 sm:p-4 space-y-4">
          <div>
            <Label>Category</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cards</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Removed Card Size selector from here */}
          <Button onClick={handleShuffle} variant="secondary" className="w-full">
            <Shuffle className="mr-2 h-4 w-4" /> Shuffle Cards
          </Button>
          <Button onClick={goToSummary} variant="destructive" className="w-full">
            <Flag className="mr-2 h-4 w-4" /> Finish & See Summary
          </Button>
        </CardContent>
      </Card>

      <div className="w-full md:w-3/4 flex flex-col items-center space-y-4 relative">
        {currentCardData ? (
          <>
            <FlashCard
              front={currentCardData.front}
              back={currentCardData.back}
              isFlipped={isFlipped}
              onClick={() => setIsFlipped(p => !p)}
              status={currentCardData.status}
              seen_count={currentCardData.seen_count}
              size={flashcardSize}
              onSetSize={setFlashcardSize}
              disableHoverEffects={false} // Enable hover effects for Learn Mode
            />
            {isFlipped && (
              <div className="w-full max-w-md text-center space-y-2 mt-4">
                <p className="font-semibold">How well did you know this?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => handleGradeAndProceed('Again')} variant="destructive">Again</Button>
                  <Button onClick={() => handleGradeAndProceed('Hard')} variant="outline">Hard</Button>
                  <Button onClick={() => handleGradeAndProceed('Good')} variant="outline">Good</Button>
                  <Button onClick={() => handleGradeAndProceed('Easy')} variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">Easy</Button>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setIsFlipped(p => !p)} variant="outline">
                <Repeat className="mr-2 h-4 w-4" /> Flip
              </Button>
              <Button onClick={handleNext} variant="outline">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {activeCards.length}
            </div>
          </>
        ) : (
          <Card className="text-center p-8"><CardContent>No cards in this category.</CardContent></Card>
        )}
      </div>
    </div>
  );
}