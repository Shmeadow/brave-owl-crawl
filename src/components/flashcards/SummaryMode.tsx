"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryData {
  type: 'learn' | 'test';
  totalAttempted?: number;
  totalQuestions?: number;
  score: number;
  detailedResults: {
    term: string;
    correctDefinition: string;
    userAnswer: string | null;
    isCorrect: boolean;
    closeness?: number;
    cardId: string;
  }[];
}

interface SummaryModeProps {
  summaryData: SummaryData | null;
  summaryModeSource: 'learn' | 'test' | null;
}

export function SummaryMode({ summaryData, summaryModeSource }: SummaryModeProps) {
  if (!summaryData) {
    return (
      <Card className="text-center p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">No summary available.</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete a session in Learn Mode or Test Mode to see a summary.</p>
        </CardContent>
      </Card>
    );
  }

  const { totalAttempted, score, detailedResults, totalQuestions } = summaryData;
  const correctCount = score;
  const totalItems = totalQuestions || totalAttempted || 0;
  const incorrectCount = totalItems - correctCount;
  const accuracy = totalItems > 0 ? parseFloat(((correctCount / totalItems) * 100).toFixed(2)) : 0;

  return (
    <Card className="bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-foreground text-center">
          {summaryModeSource === 'learn' ? 'Learn Session Summary' : 'Test Session Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-8">
          <div className="bg-muted p-4 rounded-lg shadow-sm border border-border">
            <p className="text-lg font-semibold text-foreground">Total Questions</p>
            <p className="text-4xl font-bold text-primary">{totalItems}</p>
          </div>
          <div className="bg-green-100/70 p-4 rounded-lg shadow-sm border border-green-200/50">
            <p className="text-lg font-semibold text-green-800">Correct Answers</p>
            <p className="text-4xl font-bold text-green-900">{correctCount}</p>
          </div>
          <div className="bg-red-100/70 p-4 rounded-lg shadow-sm border border-red-200/50">
            <p className="text-lg font-semibold text-red-800">Incorrect Answers</p>
            <p className="text-4xl font-bold text-red-900">{incorrectCount}</p>
          </div>
        </div>

        <div className="text-center text-2xl font-bold text-foreground mb-8">
          Overall Accuracy: {accuracy}%
        </div>

        {detailedResults && detailedResults.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Detailed Results</h3>
            <ul className="space-y-4">
              {detailedResults.map((result, index) => (
                <li key={index} className={cn(
                  "p-4 rounded-lg shadow-sm border",
                  result.isCorrect ? 'bg-green-50/70 border-green-200/50' : 'bg-red-50/70 border-red-200/50'
                )}>
                  <p className="font-semibold text-lg text-foreground">Term: <span className="text-primary">{result.term}</span></p>
                  <p className="text-muted-foreground">Your Answer: <span className={cn(result.isCorrect ? 'text-green-700' : 'text-red-700')}>{result.userAnswer || '[No Answer]'}</span></p>
                  <p className="text-muted-foreground">Correct Answer: <span className="font-medium text-primary">{result.correctDefinition}</span></p>
                  {summaryModeSource === 'learn' && result.closeness !== undefined && (
                    <p className="text-muted-foreground text-sm mt-1">Closeness: {result.closeness}%</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}