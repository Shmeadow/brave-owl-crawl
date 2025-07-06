"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Check, X, RefreshCw, Flag } from 'lucide-react';
import { CardData } from '@/hooks/flashcards/types';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TestModeProps {
  flashcards: CardData[];
  onGradeCard: (cardId: string, grade: 'Easy' | 'Good' | 'Hard' | 'Again') => void;
  onQuit: () => void;
}

interface SessionResult {
  cardId: string;
  term: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  grade: 'Easy' | 'Good' | 'Hard' | 'Again';
}

export function TestMode({ flashcards, onGradeCard, onQuit }: TestModeProps) {
  const [testDeck, setTestDeck] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const restartTest = useCallback(() => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setTestDeck(shuffled);
    setCurrentIndex(0);
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(null);
    setSessionResults([]);
    setIsComplete(false);
    if (flashcards.length > 0) {
      toast.success("Test restarted!");
    }
  }, [flashcards]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCard = testDeck[currentIndex];

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      toast.error("Please enter an answer or skip.");
      return;
    }
    const correct = userAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();
    setIsCorrect(correct);
    setIsAnswered(true);
  };

  const handleSkip = () => {
    handleGrade('Again');
  };

  const handleGrade = (grade: 'Easy' | 'Good' | 'Hard' | 'Again') => {
    if (!currentCard) return;
    onGradeCard(currentCard.id, grade);
    setSessionResults(prev => [...prev, {
      cardId: currentCard.id,
      term: currentCard.front,
      userAnswer: userAnswer,
      correctAnswer: currentCard.back,
      isCorrect: isCorrect ?? (grade !== 'Again'),
      grade: grade,
    }]);
    
    if (currentIndex < testDeck.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setUserAnswer('');
      setIsCorrect(null);
    } else {
      setIsComplete(true);
    }
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
            <Button onClick={restartTest} size="lg">
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
    <div className="w-full max-w-2xl mx-auto space-y-4">
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

          {!isAnswered ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Type your answer..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={4}
                className="text-base"
              />
              <div className="flex justify-end gap-2">
                <Button onClick={handleSkip} variant="secondary">Skip</Button>
                <Button onClick={handleSubmit}>Submit Answer</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={cn("p-4 rounded-lg border", isCorrect ? "bg-green-100/70 dark:bg-green-900/30 border-green-500" : "bg-red-100/70 dark:bg-red-900/30 border-red-500")}>
                <div className="flex items-center gap-2 font-bold text-lg mb-2">
                  {isCorrect ? <Check className="text-green-600" /> : <X className="text-red-600" />}
                  <span>{isCorrect ? "Correct!" : "Incorrect"}</span>
                </div>
                <p className="text-sm text-muted-foreground">Your answer: <span className="text-foreground">{userAnswer}</span></p>
                {!isCorrect && <p className="text-sm text-muted-foreground">Correct answer: <span className="text-foreground">{currentCard.back}</span></p>}
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold">How well did you know this?</p>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => handleGrade('Again')} variant="destructive">Again</Button>
                  <Button onClick={() => handleGrade('Hard')} variant="outline">Hard</Button>
                  <Button onClick={() => handleGrade('Good')} variant="outline">Good</Button>
                  <Button onClick={() => handleGrade('Easy')} variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">Easy</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}