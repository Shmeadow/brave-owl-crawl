"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Check, X, RefreshCw, Flag, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { CardData } from '@/hooks/flashcards/types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { FlashCard } from '@/components/flash-card'; // Import FlashCard
import { FlashcardSize } from '@/hooks/use-flashcard-size'; // Import FlashcardSize type

interface TestModeProps {
  flashcards: CardData[];
  onAnswer: (cardId: string, isCorrect: boolean, userAnswer: string) => void;
  onQuit: () => void;
  testType: 'text' | 'choices';
  flashcardSize: FlashcardSize; // New prop
  setFlashcardSize: (size: FlashcardSize) => void; // New prop
}

interface SessionResult {
  cardId: string;
  term: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export function TestMode({ flashcards, onAnswer, onQuit, testType, flashcardSize, setFlashcardSize }: TestModeProps) {
  const [testDeck, setTestDeck] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);

  const cardIdString = useMemo(() => flashcards.map(c => c.id).sort().join(','), [flashcards]);

  // This effect now correctly restarts the test only when the set of cards changes.
  useEffect(() => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setTestDeck(shuffled);
    setCurrentIndex(0);
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(null);
    setSessionResults([]);
    setIsComplete(false);
    if (flashcards.length > 0) {
      toast.success("Test started!");
    }
  }, [cardIdString]);

  const currentCard = testDeck[currentIndex];

  useEffect(() => {
    if (currentCard && testType === 'choices') {
      const distractors = testDeck
        .filter(card => card.id !== currentCard.id)
        .map(card => card.back);

      const uniqueDistractors = [...new Set(distractors)];
      const shuffledDistractors = uniqueDistractors.sort(() => 0.5 - Math.random());
      const selectedDistractors = shuffledDistractors.slice(0, 3);

      const allChoices = [currentCard.back, ...selectedDistractors].sort(() => 0.5 - Math.random());
      setChoices(allChoices);
    }
  }, [currentCard, testType, testDeck]);

  const handleNext = useCallback(() => {
    if (currentIndex < testDeck.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setUserAnswer('');
      setIsCorrect(null);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, testDeck.length]);

  const handleSubmission = useCallback((answer: string) => {
    if (!currentCard) return;
    const correct = answer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();
    
    setIsCorrect(correct);
    setIsAnswered(true);
    onAnswer(currentCard.id, correct, answer);
    setSessionResults(prev => [...prev, {
      cardId: currentCard.id,
      term: currentCard.front,
      userAnswer: answer,
      correctAnswer: currentCard.back,
      isCorrect: correct,
    }]);

    setShowFeedbackOverlay(true);
    setTimeout(() => {
      setShowFeedbackOverlay(false);
      handleNext();
    }, 800); // Shortened feedback duration
  }, [currentCard, onAnswer, handleNext]);

  const handleSkip = () => {
    if (!currentCard) return;
    onAnswer(currentCard.id, false, "[SKIPPED]");
    setSessionResults(prev => [...prev, {
      cardId: currentCard.id,
      term: currentCard.front,
      userAnswer: "[SKIPPED]",
      correctAnswer: currentCard.back,
      isCorrect: false,
    }]);
    handleNext();
  };

  if (flashcards.length === 0) {
    return (
      <Card className="text-center p-8 w-full">
        <CardContent>
          <p className="text-lg">No flashcards to test.</p>
          <p className="text-muted-foreground">Please add cards in the "Manage Deck" tab.</p>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    return (
      <Card className="text-center p-8 w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Test Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xl">Your final score is:</p>
          <p className="text-6xl font-bold text-primary">{correctCount} / {testDeck.length}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => {
              const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
              setTestDeck(shuffled);
              setCurrentIndex(0);
              setUserAnswer('');
              setIsAnswered(false);
              setIsCorrect(null);
              setSessionResults([]);
              setIsComplete(false);
              toast.success("Test restarted!");
            }} size="lg">
              <RefreshCw className="mr-2 h-4 w-4" /> Restart Test
            </Button>
            <Button onClick={onQuit} variant="secondary" size="lg">
              <Flag className="mr-2 h-4 w-4" /> Exit to Study
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentCard) {
    return <Card className="text-center p-8 w-full"><CardContent>Loading test...</CardContent></Card>;
  }

  const progressPercentage = testDeck.length > 0 ? ((currentIndex + 1) / testDeck.length) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 relative">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Test Mode</CardTitle>
          <div className="text-sm text-muted-foreground">Card {currentIndex + 1} / {testDeck.length}</div>
          <Button onClick={onQuit} variant="ghost" size="sm">Quit Test</Button>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="w-full mb-6" />
          
          <div className="bg-muted p-6 rounded-lg shadow-inner text-center border mb-4">
            <p className="text-2xl font-semibold text-foreground">{currentCard.front}</p>
          </div>

          {isAnswered ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Loading next card...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testType === 'text' ? (
                <>
                  <Textarea
                    placeholder="Type your answer..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    rows={4}
                    className="text-base"
                  />
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleSkip} variant="secondary">Skip</Button>
                    <Button onClick={() => handleSubmission(userAnswer)}>Submit Answer</Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {choices.map((choice, index) => (
                    <Button key={index} onClick={() => handleSubmission(choice)} className="h-auto py-4 text-base whitespace-normal">
                      {choice}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {showFeedbackOverlay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center animate-in fade-in-0">
            <div className={cn(
                "p-8 rounded-lg text-white text-4xl font-bold flex items-center gap-4 shadow-2xl animate-in zoom-in-95",
                isCorrect ? 'bg-green-600' : 'bg-red-600'
            )}>
                {isCorrect ? <CheckCircle size={48} /> : <XCircle size={48} />}
                {isCorrect ? 'Correct!' : 'Incorrect!'}
            </div>
        </div>
      )}
    </div>
  );
}