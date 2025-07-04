"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { CardData } from '@/hooks/use-flashcards'; // Updated import
import { getWeightedRandomCard, calculateCloseness } from '@/utils/flashcard-helpers';
import { toast } from 'sonner';

interface LearnModeProps {
  flashcards: CardData[];
  handleAnswerFeedback: (cardId: string, isCorrect: boolean) => void; // Updated prop
  goToSummary: (data: any, source: 'learn' | 'test') => void;
  isCurrentRoomWritable: boolean;
}

export function LearnMode({ flashcards, handleAnswerFeedback, goToSummary, isCurrentRoomWritable }: LearnModeProps) {
  const [shuffledCards, setShuffledCards] = useState<CardData[]>([]);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'empty' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
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
      setShowAnswer(false);
      setScore(0);
      setTotalAttempted(0);
      setSessionResults([]); // Reset session results
    } else {
      setCurrentCard(null);
      setShuffledCards([]);
      setSessionResults([]);
    }
  }, [flashcards]);

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

  const handleCheckAnswer = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to take tests in this room.");
      return;
    }
    if (!userAnswer.trim()) {
      setFeedback('empty');
      return;
    }
    setTotalAttempted(prev => prev + 1);

    const isCorrect = userAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase(); // Use card.back for definition
    const closeness = calculateCloseness(userAnswer, currentCard.back);

    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 1);
      handleAnswerFeedback(currentCard.id, true); // Call new feedback handler
      toast.success("Correct!", { duration: 1000 });
    } else {
      setFeedback('incorrect');
      handleAnswerFeedback(currentCard.id, false); // Call new feedback handler
      toast.error("Incorrect.", { duration: 1000 });
    }

    setSessionResults(prevResults => [
      ...prevResults,
      {
        term: currentCard.front, // Use card.front for term
        correctDefinition: currentCard.back, // Use card.back for definition
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        closeness: closeness,
        cardId: currentCard.id
      }
    ]);
    setShowAnswer(true);
  };

  const handleNextCard = () => {
    setUserAnswer('');
    setFeedback(null);
    setShowAnswer(false);
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
            <div className="w-full max-w-md bg-muted p-6 rounded-lg shadow-md text-center border border-border">
              <p className="text-xl font-semibold text-foreground mb-3">Term:</p>
              <p className="text-3xl font-bold text-primary">{currentCard.front}</p> {/* Use card.front */}
              <p className="text-muted-foreground text-sm mt-2">Status: {currentCard.status} | Seen: {currentCard.seen_count}</p>
            </div>

            <div className="w-full max-w-md">
              <label htmlFor="answer" className="block text-sm font-medium text-foreground mb-2">Your Answer:</label>
              <Input
                type="text"
                id="answer"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full"
                placeholder="Type the definition here"
                disabled={showAnswer || !isCurrentRoomWritable}
              />
            </div>

            {!showAnswer && (
              <Button
                onClick={handleCheckAnswer}
                disabled={!isCurrentRoomWritable}
              >
                Check Answer
              </Button>
            )}

            {showAnswer && (
              <div className="text-center mt-4">
                {feedback === 'correct' && (
                  <p className="text-green-500 text-xl font-bold mb-2 flex items-center justify-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Correct!
                  </p>
                )}
                {feedback === 'incorrect' && (
                  <p className="text-red-500 text-xl font-bold mb-2 flex items-center justify-center gap-2">
                    <XCircle className="h-6 w-6" />
                    Incorrect.
                  </p>
                )}
                {feedback === 'empty' && (
                  <p className="text-yellow-500 text-xl font-bold mb-2 flex items-center justify-center gap-2">
                    <AlertTriangle className="h-6 w-6" />
                    Please enter an answer.
                  </p>
                )}
                <p className="text-foreground text-lg mb-4">
                  The correct answer was: <span className="font-semibold text-primary">{currentCard.back}</span> {/* Use card.back */}
                </p>
                <Button
                  onClick={handleNextCard}
                  disabled={!isCurrentRoomWritable}
                >
                  Next Card
                </Button>
              </div>
            )}
            <div className="text-md text-muted-foreground mt-4">
              Score: {score} / {totalAttempted}
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