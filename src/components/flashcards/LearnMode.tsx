"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { CardData } from '@/hooks/use-flashcards';
import { getWeightedRandomCard, calculateCloseness } from '@/utils/flashcard-helpers';
import { toast } from 'sonner';
import { FlashCard } from '@/components/flash-card'; // Reusing existing FlashCard component

interface LearnModeProps {
  flashcards: CardData[];
  handleAnswerFeedback: (cardId: string, isCorrect: boolean) => void;
  updateCardInteraction: (cardId: string) => void; // New prop for general interaction
  goToSummary: (data: any, source: 'learn' | 'test') => void;
  isCurrentRoomWritable: boolean;
}

export function LearnMode({ flashcards, handleAnswerFeedback, updateCardInteraction, goToSummary, isCurrentRoomWritable }: LearnModeProps) {
  const [shuffledCards, setShuffledCards] = useState<CardData[]>([]);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'empty' | null>(null);
  const [showSelfAssessButtons, setShowSelfAssessButtons] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [sessionResults, setSessionResults] = useState<any[]>([]);

  // Initialize and shuffle cards based on mastery level
  useEffect(() => {
    if (flashcards.length > 0) {
      const initialCard = getWeightedRandomCard(flashcards);
      setCurrentCard(initialCard);
      setShuffledCards(flashcards); // Keep all cards for weighted selection
      setUserAnswer('');
      setFeedback(null);
      setIsFlipped(false);
      setShowSelfAssessButtons(false);
      setScore(0);
      setTotalAttempted(0);
      setSessionResults([]); // Reset session results
    } else {
      setCurrentCard(null);
      setShuffledCards([]);
      setSessionResults([]);
    }
  }, [flashcards]);

  // When currentCard changes, update its interaction (seen_count, status)
  useEffect(() => {
    if (currentCard) {
      updateCardInteraction(currentCard.id);
    }
  }, [currentCard, updateCardInteraction]);

  if (flashcards.length === 0) {
    return (
      <Card className="text-center p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">No flashcards to learn!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Go to "Manage Flashcards" to add some.</p>
        </CardContent>
      </Card>
    );
  }

  // Safeguard: Ensure currentCard is defined before rendering its properties
  if (!currentCard) {
    return (
      <Card className="text-center p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">Loading card...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const handleFlipCard = () => {
    setIsFlipped(prev => !prev);
    setShowSelfAssessButtons(true); // Show self-assess buttons after flip
  };

  const handleSelfAssess = (isCorrect: boolean) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to record progress in this room.");
      return;
    }
    setTotalAttempted(prev => prev + 1);
    if (isCorrect) {
      setScore(prev => prev + 1);
      toast.success("Great job!", { duration: 1000 });
    } else {
      toast.error("Keep practicing!", { duration: 1000 });
    }

    handleAnswerFeedback(currentCard.id, isCorrect);

    setSessionResults(prevResults => [
      ...prevResults,
      {
        term: currentCard.front,
        correctDefinition: currentCard.back,
        userAnswer: userAnswer, // Capture user's typed answer for summary
        isCorrect: isCorrect,
        closeness: calculateCloseness(userAnswer, currentCard.back),
        cardId: currentCard.id,
        cardData: currentCard, // Pass full card data for summary
      }
    ]);

    // Move to next card after self-assessment
    handleNextCard();
  };

  const handleNextCard = () => {
    setUserAnswer('');
    setFeedback(null);
    setIsFlipped(false);
    setShowSelfAssessButtons(false);
    const nextCard = getWeightedRandomCard(shuffledCards);
    setCurrentCard(nextCard);
  };

  const handleEndSession = () => {
    goToSummary({
      type: 'learn',
      totalAttempted: totalAttempted,
      score: score,
      detailedResults: sessionResults
    }, 'learn');
  };

  return (
    <Card className="flex flex-col items-center space-y-6 bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-foreground">Learn Mode</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 w-full">
        {currentCard && (
          <>
            <FlashCard
              front={currentCard.front}
              back={currentCard.back}
              isFlipped={isFlipped}
              onClick={handleFlipCard}
            />

            <div className="text-md text-muted-foreground mt-4">
              Status: <span className="capitalize">{currentCard.status}</span> | Seen: {currentCard.seen_count} | Correct: {currentCard.correct_guesses} | Incorrect: {currentCard.incorrect_guesses}
            </div>

            <div className="w-full max-w-md">
              <label htmlFor="answer" className="block text-sm font-medium text-foreground mb-2">Your Answer (Optional for self-check):</label>
              <Input
                type="text"
                id="answer"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full"
                placeholder="Type what you think the answer is"
                disabled={!isCurrentRoomWritable}
              />
            </div>

            {!isFlipped && (
              <Button onClick={handleFlipCard}>
                Flip Card
              </Button>
            )}

            {isFlipped && showSelfAssessButtons && (
              <div className="flex gap-4 mt-4">
                <Button
                  onClick={() => handleSelfAssess(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={!isCurrentRoomWritable}
                >
                  <CheckCircle className="mr-2 h-5 w-5" /> I Got It!
                </Button>
                <Button
                  onClick={() => handleSelfAssess(false)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={!isCurrentRoomWritable}
                >
                  <XCircle className="mr-2 h-5 w-5" /> Try Again
                </Button>
              </div>
            )}

            <div className="text-md text-muted-foreground mt-4">
              Session Score: {score} / {totalAttempted}
            </div>
            <Button
              onClick={handleEndSession}
              variant="outline"
            >
              End Session & View Summary
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}