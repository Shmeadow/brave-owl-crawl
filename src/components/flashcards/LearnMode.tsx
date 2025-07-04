"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, Send, XCircle } from 'lucide-react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { getWeightedRandomCard } from '@/utils/flashcard-helpers';
import { toast } from 'sonner';
import { FlashCard } from '@/components/flash-card';
import { useFlashcardCategories } from '@/hooks/flashcards/useFlashcardCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface LearnModeProps {
  flashcards: CardData[];
  handleAnswerFeedback: (cardId: string, isCorrect: boolean) => void;
  goToSummary: (data: any, source: 'learn' | 'test') => void;
  isCurrentRoomWritable: boolean;
}

export function LearnMode({ flashcards, handleAnswerFeedback, goToSummary, isCurrentRoomWritable }: LearnModeProps) {
  const { categories } = useFlashcardCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [activeCards, setActiveCards] = useState<CardData[]>([]);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [trackProgress, setTrackProgress] = useState(true);

  useEffect(() => {
    const filtered = selectedCategoryId === 'all'
      ? flashcards
      : flashcards.filter(c => c.category_id === selectedCategoryId);
    setActiveCards(filtered);
  }, [flashcards, selectedCategoryId]);

  useEffect(() => {
    if (activeCards.length > 0) {
      setCurrentIndex(0);
      setCurrentCard(activeCards[0]);
    } else {
      setCurrentCard(null);
    }
    // Reset state when active cards change
    setIsFlipped(false);
    setUserAnswer('');
  }, [activeCards]);

  const currentCardData = activeCards[currentIndex];

  const handleNext = () => {
    if (activeCards.length === 0) return;
    const nextIndex = (currentIndex + 1) % activeCards.length;
    setCurrentIndex(nextIndex);
    setIsFlipped(false);
    setUserAnswer('');
  };

  const handleBack = () => {
    if (activeCards.length === 0) return;
    const prevIndex = (currentIndex - 1 + activeCards.length) % activeCards.length;
    setCurrentIndex(prevIndex);
    setIsFlipped(false);
    setUserAnswer('');
  };

  const handleSubmitAnswer = () => {
    if (!currentCardData) return;
    if (!userAnswer.trim()) {
      toast.info("Type an answer to check it.");
      return;
    }

    const isCorrect = userAnswer.trim().toLowerCase() === currentCardData.back.trim().toLowerCase();
    
    if (trackProgress) {
      if (!isCurrentRoomWritable) {
        toast.error("You do not have permission to track progress in this room.");
        return;
      }
      handleAnswerFeedback(currentCardData.id, isCorrect);
      toast(isCorrect ? "Correct!" : "Incorrect, try again!", {
        icon: isCorrect ? <Check className="text-green-500" /> : <XCircle className="text-red-500" />,
      });
    } else {
      toast.info(isCorrect ? "You got it right! (Progress not tracked)" : "That's not quite right. (Progress not tracked)");
    }

    setIsFlipped(true);
  };

  if (flashcards.length === 0) {
    return <Card className="text-center p-8"><CardContent>No flashcards to learn! Add some in "Manage Deck".</CardContent></Card>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      <Card className="w-full md:w-1/4">
        <CardContent className="p-4 space-y-4">
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
          <div className="flex items-center space-x-2">
            <Switch id="track-progress" checked={trackProgress} onCheckedChange={setTrackProgress} disabled={!isCurrentRoomWritable} />
            <Label htmlFor="track-progress">Track Progress</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            When off, your answers won't affect card statuses. Good for casual studying.
          </p>
        </CardContent>
      </Card>

      <div className="w-full md:w-3/4 flex flex-col items-center space-y-4">
        {currentCardData ? (
          <>
            <FlashCard
              front={currentCardData.front}
              back={currentCardData.back}
              isFlipped={isFlipped}
              onClick={() => setIsFlipped(p => !p)}
            />
            <div className="w-full max-w-md flex gap-2">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                placeholder="Type your answer..."
                className="flex-grow"
              />
              <Button onClick={handleSubmitAnswer}>
                <Send className="mr-2 h-4 w-4" /> Submit
              </Button>
            </div>
            <div className="flex gap-4">
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext}>
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