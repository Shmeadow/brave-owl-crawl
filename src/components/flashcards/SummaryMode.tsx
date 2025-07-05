"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardData } from '@/hooks/use-flashcards';

export interface DetailedResult {
  term: string;
  correctDefinition: string;
  userAnswer: string | null;
  isCorrect: boolean;
  closeness?: number;
  cardId: string;
  cardData: CardData;
}

export interface SummaryData {
  type: 'learn' | 'test';
  totalAttempted?: number;
  totalQuestions?: number;
  score: number;
  detailedResults: DetailedResult[];
}

interface SummaryModeProps {
  summaryData: SummaryData | null;
  summaryModeSource: 'learn' | 'test' | null;
}

export function SummaryMode({ summaryData, summaryModeSource }: SummaryModeProps) {
  const [activeTab, setActiveTab] = useState('overall');

  if (!summaryData || summaryData.detailedResults.length === 0) {
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

  const renderOverallSummary = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-8">
        <div className="bg-muted p-4 rounded-lg shadow-sm border border-border">
          <p className="text-lg font-semibold text-foreground">Total Questions</p>
          <p className="text-4xl font-bold text-primary">{totalItems}</p>
        </div>
        <div className="bg-green-100/70 dark:bg-green-900/30 p-4 rounded-lg shadow-sm border border-green-200/50 dark:border-green-800/50">
          <p className="text-lg font-semibold text-green-800 dark:text-green-300">Correct Answers</p>
          <p className="text-4xl font-bold text-green-900 dark:text-green-200">{correctCount}</p>
        </div>
        <div className="bg-red-100/70 dark:bg-red-900/30 p-4 rounded-lg shadow-sm border border-red-200/50 dark:border-red-800/50">
          <p className="text-lg font-semibold text-red-800 dark:text-red-300">Incorrect Answers</p>
          <p className="text-4xl font-bold text-red-900 dark:text-red-200">{incorrectCount}</p>
        </div>
      </div>

      <div className="text-center text-2xl font-bold text-foreground mb-8">
        Overall Accuracy: {accuracy}%
      </div>
    </>
  );

  const renderDetailedResults = (filteredResults: DetailedResult[]) => (
    <ul className="space-y-4">
      {filteredResults.map((result, index) => (
        <li key={index} className={cn(
          "p-4 rounded-lg shadow-sm border",
          result.isCorrect ? 'bg-green-50/70 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/30' : 'bg-red-50/70 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/30'
        )}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-lg text-foreground">Term: <span className="text-primary">{result.term}</span></p>
            {result.cardData.starred && <Star className="h-5 w-5 text-yellow-500 fill-current" />}
          </div>
          <p className="text-muted-foreground">Your Answer: <span className={cn(result.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>{result.userAnswer || '[No Answer]'}</span></p>
          <p className="text-muted-foreground">Correct Answer: <span className="font-medium text-primary">{result.correctDefinition}</span></p>
          {summaryModeSource === 'learn' && result.closeness !== undefined && (
            <p className="text-muted-foreground text-sm mt-1">Closeness: {result.closeness}%</p>
          )}
          <div className="text-sm text-muted-foreground mt-2">
            <p>Total Correct Guesses: {result.cardData.correct_guesses}</p>
            <p>Total Incorrect Guesses: {result.cardData.incorrect_guesses}</p>
            <p>Current Status: <span className="capitalize">{result.cardData.status}</span></p>
          </div>
        </li>
      ))}
    </ul>
  );

  const getCategoryAccuracy = (category: CardData['status'] | 'starred' | 'unstarred') => {
    let filteredCards: DetailedResult[] = [];
    if (category === 'starred') {
      filteredCards = detailedResults.filter(r => r.cardData.starred);
    } else if (category === 'unstarred') {
      filteredCards = detailedResults.filter(r => !r.cardData.starred);
    } else {
      filteredCards = detailedResults.filter(r => r.cardData.status === category);
    }

    const categoryCorrect = filteredCards.filter(r => r.isCorrect).length;
    const categoryTotal = filteredCards.length;
    const categoryAccuracy = categoryTotal > 0 ? parseFloat(((categoryCorrect / categoryTotal) * 100).toFixed(2)) : 0;
    return { correct: categoryCorrect, total: categoryTotal, accuracy: categoryAccuracy, results: filteredCards };
  };

  return (
    <Card className="bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-foreground text-center">
          {summaryModeSource === 'learn' ? 'Learn Session Summary' : 'Test Session Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overall" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="by-status">By Status</TabsTrigger>
            <TabsTrigger value="by-starred">By Starred</TabsTrigger>
            <TabsTrigger value="all-results">All Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="mt-4">
            {renderOverallSummary()}
          </TabsContent>

          <TabsContent value="by-status" className="mt-4">
            <h3 className="text-xl font-bold text-foreground mb-4 text-center">Accuracy by Card Status</h3>
            <div className="space-y-4">
              {(['Learning', 'Beginner', 'Intermediate', 'Advanced', 'Mastered'] as const).map(status => {
                const { correct, total, accuracy, results } = getCategoryAccuracy(status);
                if (total === 0) return null;
                return (
                  <div key={status} className="p-4 rounded-lg border bg-muted backdrop-blur-xl">
                    <h4 className="font-semibold text-lg capitalize mb-2">{status} Cards</h4>
                    <p className="text-sm text-muted-foreground">Correct: {correct} / Total: {total}</p>
                    <p className="text-md font-bold text-primary">Accuracy: {accuracy}%</p>
                    {results.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-500 hover:underline">View Details</summary>
                        <div className="mt-2 space-y-2">
                          {renderDetailedResults(results)}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="by-starred" className="mt-4">
            <h3 className="text-xl font-bold text-foreground mb-4 text-center">Accuracy by Starred Status</h3>
            <div className="space-y-4">
              {(['starred', 'unstarred'] as const).map(status => {
                const { correct, total, accuracy, results } = getCategoryAccuracy(status);
                if (total === 0) return null;
                return (
                  <div key={status} className="p-4 rounded-lg border bg-muted backdrop-blur-xl">
                    <h4 className="font-semibold text-lg capitalize mb-2">{status} Cards</h4>
                    <p className="text-sm text-muted-foreground">Correct: {correct} / Total: {total}</p>
                    <p className="text-md font-bold text-primary">Accuracy: {accuracy}%</p>
                    {results.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-500 hover:underline">View Details</summary>
                        <div className="mt-2 space-y-2">
                          {renderDetailedResults(results)}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="all-results" className="mt-4">
            <h3 className="text-2xl font-bold text-foreground mb-4 text-center">All Detailed Results</h3>
            {detailedResults && detailedResults.length > 0 ? (
              renderDetailedResults(detailedResults)
            ) : (
              <p className="text-muted-foreground text-center">No detailed results to display.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}