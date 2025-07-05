"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, Send, XCircle, Repeat, Shuffle, CheckCircle, Flag } from 'lucide-react';
import { CardData, Category } from '@/hooks/flashcards/types';
import { getWeightedRandomCard } from '@/utils/flashcard-helpers';
import { toast } from 'sonner';
import { FlashCard } from '@/components/flash-card';
import { useFlashcardCategories } from '@/hooks/flashcards/useFlashcardCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LearnModeProps {
  flashcards: CardData[];
  handleAnswerFeedback: (cardId: string, isCorrect: boolean, userAnswer: string | null, source: 'learn' | 'test') => void;
  goToSummary: () => void;
}

export function LearnMode({ flashcards, handleAnswerFeedback, goToSummary }: LearnModeProps) {
  const { categories } = useFlashcardCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [activeCards, setActiveCards] = useState<CardData[]>([]);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [trackProgress, setTrackProgress] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);

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
    setIsFlipped(false);
    setUserAnswer('');
  }, [activeCards]);

  const currentCardData = activeCards[currentIndex];

  const handleShuffle = () => {
    if (activeCards.length > 1) {
      const shuffled = [...activeCards].sort(() => Math.random() - 0.5);
      setActiveCards(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      setUserAnswer('');
      toast.success("Cards shuffled!");
    }
  };

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
      handleAnswerFeedback(currentCardData.id, isCorrect, userAnswer, 'learn');
    }

    setIsCorrectAnswer(isCorrect);
    setShowFeedback(true);
    
    setTimeout(() => {
      setShowFeedback(false);
      setIsFlipped(true);
    }, 1500);
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
            <Switch id="track-progress" checked={trackProgress} onCheckedChange={setTrackProgress} />
            <Label htmlFor="track-progress">Track Progress</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            When off, your answers won't affect card statuses. Good for casual studying.
          </p>
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
        {showFeedback && (
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg text-white text-2xl font-bold flex items-center gap-4 shadow-2xl z-10",
            isCorrectAnswer ? 'bg-green-600' : 'bg-red-600'
          )}>
            {isCorrectAnswer ? <CheckCircle size={32} /> : <XCircle size={32} />}
            {isCorrectAnswer ? 'Correct!' : 'Incorrect!'}
          </div>
        )}
      </div>
    </div>
  );
}