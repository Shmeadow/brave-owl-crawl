"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Shuffle, RefreshCw, Timer, Flag, Play } from 'lucide-react';
import { CardData } from '@/hooks/flashcards/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface TestModeProps {
  flashcards: CardData[];
  handleAnswerFeedback: (cardId: string, isCorrect: boolean, userAnswer: string | null, source: 'learn' | 'test') => void;
  goToSummary: () => void;
}

export function TestMode({ flashcards, handleAnswerFeedback, goToSummary }: TestModeProps) {
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [testSessionResults, setTestSessionResults] = useState<any[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState<{ answer: string; isCorrect: boolean } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [isStressMode, setIsStressMode] = useState(false);
  const [stressTime, setStressTime] = useState(5);
  const [isStressTestRunning, setIsStressTestRunning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateTestQuestions = useCallback((cards: CardData[]) => {
    const questions = cards.map(card => {
      const otherDefinitions = cards.filter(c => c.id !== card.id).map(c => c.back);
      const shuffledOtherDefinitions = otherDefinitions.sort(() => Math.random() - 0.5);
      const fakeDefinitions = shuffledOtherDefinitions.slice(0, 3);
      const options = [card.back, ...fakeDefinitions];
      const shuffledOptions = options.sort(() => Math.random() - 0.5);
      return {
        id: card.id,
        term: card.front,
        correctDefinition: card.back,
        options: shuffledOptions,
        cardData: card,
      };
    }).sort(() => Math.random() - 0.5);
    setTestQuestions(questions);
  }, []);

  const resetTestState = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setTestSessionResults([]);
    setTestCompleted(false);
    setSubmittedAnswer(null);
    setShowFeedback(false);
    setIsStressTestRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(stressTime);
  }, [stressTime]);

  useEffect(() => {
    if (flashcards.length > 3) {
      generateTestQuestions(flashcards);
      resetTestState();
    } else {
      setTestQuestions([]);
    }
  }, [flashcards, generateTestQuestions, resetTestState]);

  const handleShuffleTest = useCallback(() => {
    if (flashcards.length > 3) {
      generateTestQuestions(flashcards);
      resetTestState();
      toast.success("Test questions have been shuffled!");
    }
  }, [flashcards, generateTestQuestions, resetTestState]);

  const handleRestartTest = useCallback(() => {
    if (testQuestions.length > 0) {
      resetTestState();
      toast.success("Test restarted!");
    }
  }, [testQuestions, resetTestState]);

  useEffect(() => {
    if (testCompleted) {
      goToSummary();
    }
  }, [testCompleted, goToSummary]);

  const currentQuestion = testQuestions[currentQuestionIndex];

  const handleSelectAnswer = (selectedOption: string) => {
    if (submittedAnswer) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = selectedOption === currentQuestion.correctDefinition;
    setSubmittedAnswer({ answer: selectedOption, isCorrect });
    setIsCorrectAnswer(isCorrect);
    setShowFeedback(true);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    handleAnswerFeedback(currentQuestion.id, isCorrect, selectedOption, 'test');

    setTestSessionResults(prevResults => [
      ...prevResults,
      {
        term: currentQuestion.term,
        correctDefinition: currentQuestion.correctDefinition,
        userAnswer: selectedOption,
        isCorrect: isCorrect,
        cardId: currentQuestion.id,
        cardData: currentQuestion.cardData,
        source: 'test',
      }
    ]);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestionIndex < testQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSubmittedAnswer(null);
      } else {
        setTestCompleted(true);
      }
    }, 1500);
  };

  const handleStartStressTest = () => {
    setIsStressTestRunning(true);
    setCountdown(stressTime);
  };

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isStressMode && isStressTestRunning && !submittedAnswer && !testCompleted && currentQuestion) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, isStressMode, isStressTestRunning, testCompleted, submittedAnswer, currentQuestion]);

  useEffect(() => {
    if (countdown === 0 && isStressMode && !submittedAnswer && !testCompleted) {
      toast.error("Time's up! Restarting the test.");
      handleRestartTest();
    }
  }, [countdown, isStressMode, submittedAnswer, testCompleted, handleRestartTest]);

  if (flashcards.length < 4) {
    return <Card className="text-center p-8"><CardContent>You need at least 4 cards to start a test.</CardContent></Card>;
  }

  if (!currentQuestion) {
    return <Card className="text-center p-8"><CardContent>Generating test...</CardContent></Card>;
  }

  const progressPercentage = testQuestions.length > 0 ? ((currentQuestionIndex + 1) / testQuestions.length) * 100 : 0;

  return (
    <div className="grid md:grid-cols-3 gap-6 w-full">
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader><CardTitle>Test Options</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="stress-mode" className="flex-grow">Stress Test Mode</Label>
              <Switch id="stress-mode" checked={isStressMode} onCheckedChange={setIsStressMode} />
            </div>
            {isStressMode && (
              <>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={stressTime}
                    onChange={(e) => setStressTime(Math.max(5, parseInt(e.target.value, 10) || 5))}
                    className="w-20 h-8"
                  />
                  <Label>seconds</Label>
                </div>
                {!isStressTestRunning && (
                  <Button onClick={handleStartStressTest} className="w-full mt-2">
                    <Play className="mr-2 h-4 w-4" /> Start Stress Test
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleRestartTest} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" /> Restart Test
            </Button>
            <Button onClick={handleShuffleTest} variant="outline" className="w-full">
              <Shuffle className="mr-2 h-4 w-4" /> Shuffle Questions
            </Button>
            <Button onClick={goToSummary} variant="destructive" className="w-full">
              <Flag className="mr-2 h-4 w-4" /> End Test & See Summary
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="flex flex-col space-y-6 bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full relative">
          {showFeedback && (
            <div className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-xl z-20 transition-opacity duration-300",
              isCorrectAnswer ? 'bg-green-500/90' : 'bg-red-500/90'
            )}>
              <div className="text-white text-4xl font-bold flex items-center gap-4">
                {isCorrectAnswer ? <CheckCircle size={48} /> : <XCircle size={48} />}
                {isCorrectAnswer ? 'Correct!' : 'Incorrect!'}
              </div>
            </div>
          )}
          <CardHeader className="w-full p-0">
            <div className="flex justify-between items-center mb-2">
              <CardTitle>Question {currentQuestionIndex + 1} of {testQuestions.length}</CardTitle>
              <div className="text-lg font-semibold">Score: {score}</div>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            {isStressMode && isStressTestRunning && (
              <div className="text-center mt-4">
                <div className="text-2xl font-mono font-bold text-destructive">
                  {countdown}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 w-full p-0">
            <div className="w-full bg-muted p-6 rounded-lg shadow-inner text-center border">
              <p className="text-xl font-semibold text-foreground mb-3">Which is the correct definition for:</p>
              <p className="text-3xl font-bold text-primary">{currentQuestion.term}</p>
            </div>
            <div className="w-full space-y-3">
              {currentQuestion.options.map((option: string, index: number) => {
                const isSelected = submittedAnswer?.answer === option;
                const isCorrectAnswer = option === currentQuestion.correctDefinition;
                
                let buttonStyle = 'bg-background hover:bg-muted';
                if (submittedAnswer) {
                  if (isCorrectAnswer) {
                    buttonStyle = 'bg-green-600 hover:bg-green-700 text-white border-green-700';
                  } else if (isSelected && !submittedAnswer.isCorrect) {
                    buttonStyle = 'bg-red-600 hover:bg-red-700 text-white border-red-700';
                  } else {
                    buttonStyle = 'bg-muted opacity-50';
                  }
                }

                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleSelectAnswer(option)}
                    className={cn(
                      'w-full text-left justify-start px-5 py-4 rounded-lg border-2 transition-all duration-200 h-auto text-base',
                      buttonStyle
                    )}
                    disabled={!!submittedAnswer}
                  >
                    {submittedAnswer && isCorrectAnswer && <CheckCircle className="mr-3 h-5 w-5" />}
                    {submittedAnswer && !isCorrectAnswer && isSelected && <XCircle className="mr-3 h-5 w-5" />}
                    {option}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}