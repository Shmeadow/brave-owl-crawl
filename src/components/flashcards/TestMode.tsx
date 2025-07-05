"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { CardData } from '@/hooks/use-flashcards';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TestModeProps {
  flashcards: CardData[];
  handleAnswerFeedback: (cardId: string, isCorrect: boolean) => void;
  goToSummary: (data: any, source: 'learn' | 'test') => void;
}

export function TestMode({ flashcards, handleAnswerFeedback, goToSummary }: TestModeProps) {
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [testSessionResults, setTestSessionResults] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  useEffect(() => {
    if (flashcards.length > 3) { // Need at least 4 cards for a meaningful test
      generateTestQuestions(flashcards);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setTestSessionResults([]);
      setTestCompleted(false);
    } else {
      setTestQuestions([]);
      setTestSessionResults([]);
    }
  }, [flashcards]);

  const generateTestQuestions = (cards: CardData[]) => {
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
  };

  if (flashcards.length < 4) {
    return <Card className="text-center p-8"><CardContent>You need at least 4 cards to start a test.</CardContent></Card>;
  }

  const currentQuestion = testQuestions[currentQuestionIndex];

  const handleEndTest = () => {
    goToSummary({
      type: 'test',
      totalQuestions: testSessionResults.length,
      score: score,
      detailedResults: testSessionResults
    }, 'test');
  };

  // Automatically navigate to summary when test is completed
  useEffect(() => {
    if (testCompleted) {
      handleEndTest();
    }
  }, [testCompleted]);

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer.");
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctDefinition;
    setIsCorrectAnswer(isCorrect);
    setShowFeedback(true);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    handleAnswerFeedback(currentQuestion.id, isCorrect);

    setTestSessionResults(prevResults => [
      ...prevResults,
      {
        term: currentQuestion.term,
        correctDefinition: currentQuestion.correctDefinition,
        userAnswer: selectedAnswer,
        isCorrect: isCorrect,
        cardId: currentQuestion.id,
        cardData: currentQuestion.cardData,
      }
    ]);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestionIndex < testQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setTestCompleted(true);
      }
    }, 1500);
  };

  if (!currentQuestion) {
    return <Card className="text-center p-8"><CardContent>Generating test...</CardContent></Card>;
  }

  return (
    <Card className="flex flex-col items-center space-y-6 bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full relative">
      <CardContent className="flex flex-col items-center space-y-6 w-full">
        <>
          <div className="text-lg text-muted-foreground font-semibold">
            Question {currentQuestionIndex + 1} / {testQuestions.length}
          </div>
          <div className="w-full max-w-md bg-muted p-6 rounded-lg shadow-md text-center border">
            <p className="text-xl font-semibold text-foreground mb-3">Term:</p>
            <p className="text-3xl font-bold text-primary">{currentQuestion.term}</p>
          </div>
          <div className="w-full max-w-md space-y-3">
            {currentQuestion.options.map((option: string, index: number) => (
              <Button
                key={index}
                onClick={() => setSelectedAnswer(option)}
                className={cn('w-full text-left justify-start px-5 py-3 rounded-md border transition-all duration-200 h-auto',
                  selectedAnswer === option ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                )}
                disabled={showFeedback}
              >
                {option}
              </Button>
            ))}
          </div>
          <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null || showFeedback} className="w-full max-w-md">
            Submit Answer
          </Button>
        </>
      </CardContent>
      {showFeedback && (
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg text-white text-2xl font-bold flex items-center gap-4 shadow-2xl",
          isCorrectAnswer ? 'bg-green-600' : 'bg-red-600'
        )}>
          {isCorrectAnswer ? <CheckCircle size={32} /> : <XCircle size={32} />}
          {isCorrectAnswer ? 'Correct!' : 'Incorrect!'}
        </div>
      )}
    </Card>
  );
}