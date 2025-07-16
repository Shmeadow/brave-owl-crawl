"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Check, X, RefreshCw, Flag, CheckCircle, XCircle, Loader2, SkipForward } from 'lucide-react';
import { CardData } from '@/hooks/flashcards/types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { FlashCard } from '@/components/flash-card'; // Import FlashCard
import { FlashcardSize } from '@/hooks/use-flashcard-size'; // Import FlashcardSize type
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'; // Import ToggleGroup
import { Input } from '@/components/ui/input'; // Import Input for timer setting

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

  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(5); // Default 5 seconds
  const [currentTimer, setCurrentTimer] = useState(timerDuration);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    setCurrentTimer(timerDuration); // Reset timer for new test
    if (flashcards.length > 0) {
      toast.success("Test started!");
    }
  }, [cardIdString, timerDuration]); // Add timerDuration to dependencies to reset timer when it changes

  const currentCard = testDeck[currentIndex];

  // Timer logic
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (timerEnabled && !isAnswered && currentCard && !isComplete) {
      setCurrentTimer(timerDuration); // Initialize timer for new card
      timerIntervalRef.current = setInterval(() => {
        setCurrentTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleSubmission("[TIMED OUT]"); // Submit automatically on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerEnabled, isAnswered, currentCard, isComplete, timerDuration]); // Dependencies for timer

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
      setCurrentTimer(timerDuration); // Reset timer for next card
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, testDeck.length, timerDuration]);

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

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current); // Stop timer immediately on answer
    }

    setShowFeedbackOverlay(true);
    setTimeout(() => {
      setShowFeedbackOverlay(false);
      handleNext();
    }, 800); // Shortened feedback duration
  }, [currentCard, onAnswer, handleNext]);

  const handleSkip = () => {
    if (!currentCard) return;
    handleSubmission("[SKIPPED]"); // Use handleSubmission to record skip
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
              setCurrentTimer(timerDuration); // Reset timer for new test
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

  // Determine max-width for the container based on flashcardSize
  const containerMaxWidthClass = cn({
    'max-w-[450px]': flashcardSize === 'sm', // Slightly larger than card max-w to accommodate controls
    'max-w-[600px]': flashcardSize === 'md',
    'max-w-[750px]': flashcardSize === 'lg',
  });

  return (
    <div className={cn("w-full mx-auto space-y-4 relative", containerMaxWidthClass)}>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Test Mode</CardTitle>
          <div className="text-sm text-muted-foreground">Card {currentIndex + 1} / {testDeck.length}</div>
          <Button onClick={onQuit} variant="ghost" size="sm">Quit Test</Button>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="w-full mb-6" />
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="flashcard-size-test">Card Size:</Label>
              <ToggleGroup type="single" value={flashcardSize} onValueChange={(value: FlashcardSize) => setFlashcardSize(value)} className="h-auto">
                <ToggleGroupItem value="sm" aria-label="Small" className="h-8 px-3 text-sm">S</ToggleGroupItem>
                <ToggleGroupItem value="md" aria-label="Medium" className="h-8 px-3 text-sm">M</ToggleGroupItem>
                <ToggleGroupItem value="lg" aria-label="Large" className="h-8 px-3 text-sm">L</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="timer-toggle">Timer:</Label>
              <input
                type="checkbox"
                id="timer-toggle"
                checked={timerEnabled}
                onChange={(e) => setTimerEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              {timerEnabled && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-8 text-center text-sm"
                    min="1"
                  />
                  <span className="text-sm text-muted-foreground">s</span>
                </div>
              )}
            </div>
          </div>

          <FlashCard
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isAnswered} // Only flip when answered
            onClick={() => {}} // Disable manual flip in test mode
            status={currentCard.status}
            seen_count={currentCard.seen_count}
            size={flashcardSize}
            disableHoverEffects={true} // Disable hover effects for Test Mode
          />

          {timerEnabled && !isAnswered && (
            <div className="text-center text-2xl font-bold text-primary mt-4">
              Time Left: {currentTimer}s
            </div>
          )}

          {isAnswered ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Loading next card...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
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
                    <Button onClick={handleSkip} variant="secondary">
                      <SkipForward className="mr-2 h-4 w-4" /> Skip
                    </Button>
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
                  <Button onClick={handleSkip} variant="secondary" className="col-span-full">
                    <SkipForward className="mr-2 h-4 w-4" /> Skip
                  </Button>
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