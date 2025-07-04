"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { CardData } from '@/hooks/use-flashcards'; // Updated import
import { toast } from 'sonner';

interface TestModeProps {
  flashcards: CardData[];
  handleAnswerFeedback: (cardId: string, isCorrect: boolean) => void; // Updated prop
  goToSummary: (data: any, source: 'learn' | 'test') => void;
  isCurrentRoomWritable: boolean;
}

export function TestMode({ flashcards, handleAnswerFeedback, goToSummary, isCurrentRoomWritable }: TestModeProps) {
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [testSessionResults, setTestSessionResults] = useState<any[]>([]);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  useEffect(() => {
    if (flashcards.length > 0) {
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
      const otherDefinitions = cards
        .filter(c => c.id !== card.id)
        .map(c => c.back); // Use card.back for definitions

      const shuffledOtherDefinitions = otherDefinitions.sort(() => Math.random() - 0.5);
      const fakeDefinitions = shuffledOtherDefinitions.slice(0, Math.min(3, otherDefinitions.length)); // Ensure max 3 fake definitions

      const options = [card.back, ...fakeDefinitions]; // Use card.back for correct option
      const shuffledOptions = options.sort(() => Math.random() - 0.5);

      return {
        id: card.id,
        term: card.front, // Use card.front for term
        correctDefinition: card.back, // Use card.back for correct definition
        options: shuffledOptions,
        cardData: card, // Pass full card data for summary
      };
    }).sort(() => Math.random() - 0.5);
    setTestQuestions(questions);
  };

  if (flashcards.length === 0) {
    return (
      <Card className="text-center p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">No flashcards available for a test!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Go to "Manage Flashcards" to add some.</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = testQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <Card className="text-center p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">Generating test questions...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to take tests in this room.");
      return;
    }
    if (selectedAnswer === null) {
      toast.error("Please select an answer.");
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctDefinition;
    setIsCorrectAnswer(isCorrect);
    setShowFeedbackOverlay(true);

    if (isCorrect) {
      setScore(prev => prev + 1);
      handleAnswerFeedback(currentQuestion.id, true); // Call new feedback handler
      toast.success("Correct!", { duration: 1000 });
    } else {
      handleAnswerFeedback(currentQuestion.id, false); // Call new feedback handler
      toast.error("Incorrect.", { duration: 1000 });
    }

    setTestSessionResults(prevResults => [
      ...prevResults,
      {
        term: currentQuestion.term,
        correctDefinition: currentQuestion.correctDefinition,
        userAnswer: selectedAnswer,
        isCorrect: isCorrect,
        cardId: currentQuestion.id,
        cardData: currentQuestion.cardData, // Pass full card data
      }
    ]);

    setTimeout(() => {
      setShowFeedbackOverlay(false);
      if (currentQuestionIndex < testQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setTestCompleted(true);
      }
    }, 1000); // Show feedback for 1 second
  };

  const handleEndTest = () => {
    goToSummary({
      type: 'test',
      totalQuestions: testQuestions.length,
      score: score,
      detailedResults: testSessionResults
    }, 'test');
  };

  return (
    <Card className="flex flex-col items-center space-y-6 bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-foreground">Test Mode</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 w-full">
        {!testCompleted ? (
          <>
            <div className="text-lg text-muted-foreground font-semibold">
              Question {currentQuestionIndex + 1} / {testQuestions.length}
            </div>

            <div className="w-full max-w-md bg-muted p-6 rounded-lg shadow-md text-center border border-border">
              <p className="text-xl font-semibold text-foreground mb-3">Term:</p>
              <p className="text-3xl font-bold text-primary">{currentQuestion.term}</p>
            </div>

            <div className="w-full max-w-md space-y-3">
              {currentQuestion.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full text-left justify-start px-5 py-3 rounded-md border transition-all duration-200
                    ${selectedAnswer === option
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                    }
                  `}
                  disabled={showFeedbackOverlay || !isCurrentRoomWritable}
                >
                  {option}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || showFeedbackOverlay || !isCurrentRoomWritable}
            >
              Submit Answer
            </Button>
            <Button
              onClick={handleEndTest}
              variant="outline"
              disabled={showFeedbackOverlay}
            >
              End Test Early
            </Button>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Test Completed!</h2>
            <p className="text-xl text-foreground mb-6">You scored {score} out of {testQuestions.length} questions.</p>
            <Button onClick={handleEndTest}>
              View Test Summary
            </Button>
          </div>
        )}

        {showFeedbackOverlay && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${isCorrectAnswer ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
            <div className="text-white text-5xl font-bold flex items-center gap-4 animate-pulse">
              {isCorrectAnswer ? <CheckCircle size={64} /> : <XCircle size={64} />}
              {isCorrectAnswer ? 'Correct!' : 'Incorrect!'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}