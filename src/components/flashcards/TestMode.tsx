"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Shuffle, RefreshCw, Flag } from 'lucide-react';
import { CardData } from '@/hooks/flashcards/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// Define the structure for a single question in the test
interface TestQuestion {
  id: string;
  term: string;
  correctDefinition: string;
  options: string[];
  cardData: CardData;
}

interface TestModeProps {
  flashcards: CardData[];
  handleAnswerFeedback: (cardId: string, isCorrect: boolean, userAnswer: string | null, source: 'learn' | 'test') => void;
  goToSummary: () => void;
}

export function TestMode({ flashcards, handleAnswerFeedback, goToSummary }: TestModeProps) {
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [testCompleted, setTestCompleted] = useState(false);

  // Memoize question generation to avoid re-shuffling on every render
  const generateTestQuestions = useCallback((cards: CardData[]) => {
    if (cards.length < 4) {
      return [];
    }
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
    });
    return questions.sort(() => Math.random() - 0.5);
  }, []);

  // Function to start or restart the test
  const startTest = useCallback(() => {
    const newQuestions = generateTestQuestions(flashcards);
    setTestQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setTestCompleted(false);
    if (newQuestions.length > 0) {
      toast.success("Test started!");
    }
  }, [flashcards, generateTestQuestions]);

  // Initialize the test when the component mounts or flashcards change
  useEffect(() => {
    startTest();
  }, [flashcards, startTest]);

  const handleSelectAnswer = (selectedOption: string) => {
    if (isAnswered) return; // Prevent changing answer after submission

    const currentQuestion = testQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctDefinition;

    setSelectedAnswer(selectedOption);
    setIsAnswered(true);

    if (isCorrect) {
      setScore(prev => prev + 1);
      toast.success("Correct!");
    } else {
      toast.error("Incorrect!");
    }

    // Log the feedback
    handleAnswerFeedback(currentQuestion.id, isCorrect, selectedOption, 'test');

    // Move to the next question or finish the test after a delay
    setTimeout(() => {
      if (currentQuestionIndex < testQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsAnswered(false);
        setSelectedAnswer(null);
      } else {
        setTestCompleted(true);
      }
    }, 1500); // 1.5 second delay for feedback
  };

  if (flashcards.length < 4) {
    return (
      <Card className="text-center p-8 w-full">
        <CardContent>
          <p className="text-lg">You need at least 4 flashcards to start a test.</p>
          <p className="text-muted-foreground">Please add more cards in the "Manage Deck" tab.</p>
        </CardContent>
      </Card>
    );
  }

  if (testCompleted) {
    return (
      <Card className="text-center p-8 w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Test Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xl">Your final score is:</p>
          <p className="text-6xl font-bold text-primary">{score} / {testQuestions.length}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={startTest} size="lg">
              <RefreshCw className="mr-2 h-4 w-4" /> Restart Test
            </Button>
            <Button onClick={goToSummary} variant="secondary" size="lg">
              <Flag className="mr-2 h-4 w-4" /> View Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = testQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <Card className="text-center p-8 w-full">
        <CardContent>Loading test...</CardContent>
      </Card>
    );
  }

  const progressPercentage = testQuestions.length > 0 ? ((currentQuestionIndex + 1) / testQuestions.length) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="flex flex-col space-y-6 bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full relative">
        <CardHeader className="w-full p-0">
          <div className="flex justify-between items-center mb-2">
            <CardTitle>Question {currentQuestionIndex + 1} of {testQuestions.length}</CardTitle>
            <div className="text-lg font-semibold">Score: {score}</div>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 w-full p-0">
          <div className="w-full bg-muted p-6 rounded-lg shadow-inner text-center border">
            <p className="text-xl font-semibold text-foreground mb-3">Which is the correct definition for:</p>
            <p className="text-3xl font-bold text-primary">{currentQuestion.term}</p>
          </div>
          <div className="w-full space-y-3">
            {currentQuestion.options.map((option: string, index: number) => {
              const isTheSelectedAnswer = selectedAnswer === option;
              const isTheCorrectAnswer = option === currentQuestion.correctDefinition;
              
              let buttonStyle = 'bg-background hover:bg-muted';
              if (isAnswered) {
                if (isTheCorrectAnswer) {
                  // Style for the correct answer
                  buttonStyle = 'bg-green-600 hover:bg-green-700 text-white border-green-700';
                } else if (isTheSelectedAnswer && !isTheCorrectAnswer) {
                  // Style for the selected incorrect answer
                  buttonStyle = 'bg-red-600 hover:bg-red-700 text-white border-red-700';
                } else {
                  // Style for other non-selected, incorrect answers
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
                  disabled={isAnswered}
                >
                  {isAnswered && isTheCorrectAnswer && <CheckCircle className="mr-3 h-5 w-5" />}
                  {isAnswered && isTheSelectedAnswer && !isTheCorrectAnswer && <XCircle className="mr-3 h-5 w-5" />}
                  {option}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-center gap-4">
        <Button onClick={startTest} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Restart Test
        </Button>
        <Button onClick={() => { startTest(); toast.success("Questions shuffled!"); }} variant="outline">
          <Shuffle className="mr-2 h-4 w-4" /> Shuffle & Restart
        </Button>
      </div>
    </div>
  );
}