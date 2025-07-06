"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Star, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardData } from '@/hooks/flashcards/types';
import { Button } from '@/components/ui/button';

export interface DetailedResult {
  term: string;
  correctDefinition: string;
  userAnswer: string | null;
  isCorrect: boolean;
  closeness?: number;
  cardId: string;
  cardData: CardData;
  source: 'learn' | 'test';
}

export interface SummaryData {
  totalAttempted: number;
  score: number;
  detailedResults: DetailedResult[];
  testAnalysis: {
    results: DetailedResult[];
    accuracy: number;
    total: number;
    correct: number;
  };
}

interface SummaryModeProps {
  summaryData: SummaryData | null;
  onResetProgress: () => void;
  onClearSummary: () => void;
}

export function SummaryMode({ summaryData, onResetProgress, onClearSummary }: SummaryModeProps) {
  if (!summaryData || summaryData.detailedResults.length === 0) {
    return (
      <Card className="text-center p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">No summary available.</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete a session in Learn or Test Mode to see a summary.</p>
        </CardContent>
      </Card>
    );
  }

  const { totalAttempted, score, detailedResults, testAnalysis } = summaryData;
  const correctCount = score;
  const incorrectCount = totalAttempted - correctCount;
  const accuracy = totalAttempted > 0 ? parseFloat(((correctCount / totalAttempted) * 100).toFixed(2)) : 0;

  const renderDetailedResults = (results: DetailedResult[]) => (
    <ul className="space-y-4">
      {results.map((result, index) => (
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
          <div className="text-sm text-muted-foreground mt-2">
            <p>Source: {result.source === 'learn' ? 'Learning Mode' : 'Test Mode'}</p>
            <p>Current Status: <span className="capitalize">{result.cardData.status}</span></p>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-full space-y-6">
      <Card className="bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground text-center">
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overall" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="test-analysis">Test Analysis</TabsTrigger>
              <TabsTrigger value="all-results">All Results</TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-8">
                <div className="bg-muted p-4 rounded-lg shadow-sm border border-border">
                  <p className="text-lg font-semibold text-foreground">Total Cards Reviewed</p>
                  <p className="text-4xl font-bold text-primary">{totalAttempted}</p>
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
            </TabsContent>

            <TabsContent value="test-analysis" className="mt-4">
              <h3 className="text-xl font-bold text-foreground mb-4 text-center">Test Session Analysis</h3>
              {testAnalysis.total > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-8">
                    <div className="bg-muted p-4 rounded-lg shadow-sm border border-border">
                      <p className="text-lg font-semibold text-foreground">Test Questions</p>
                      <p className="text-4xl font-bold text-primary">{testAnalysis.total}</p>
                    </div>
                    <div className="bg-green-100/70 dark:bg-green-900/30 p-4 rounded-lg shadow-sm border border-green-200/50 dark:border-green-800/50">
                      <p className="text-lg font-semibold text-green-800 dark:text-green-300">Correct</p>
                      <p className="text-4xl font-bold text-green-900 dark:text-green-200">{testAnalysis.correct}</p>
                    </div>
                    <div className="bg-red-100/70 dark:bg-red-900/30 p-4 rounded-lg shadow-sm border border-red-200/50 dark:border-red-800/50">
                      <p className="text-lg font-semibold text-red-800 dark:text-red-300">Incorrect</p>
                      <p className="text-4xl font-bold text-red-900 dark:text-red-200">{testAnalysis.total - testAnalysis.correct}</p>
                    </div>
                  </div>
                  <div className="text-center text-2xl font-bold text-foreground mb-8">
                    Test Accuracy: {testAnalysis.accuracy.toFixed(2)}%
                  </div>
                  {renderDetailedResults(testAnalysis.results)}
                </>
              ) : (
                <p className="text-muted-foreground text-center">No test data in this session.</p>
              )}
            </TabsContent>

            <TabsContent value="all-results" className="mt-4">
              <h3 className="text-2xl font-bold text-foreground mb-4 text-center">All Detailed Results (Last Attempt per Card)</h3>
              {detailedResults.length > 0 ? (
                renderDetailedResults(detailedResults)
              ) : (
                <p className="text-muted-foreground text-center">No detailed results to display.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Deck Actions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={onResetProgress} variant="destructive" className="w-full">
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Card Progress
          </Button>
          <p className="text-xs text-muted-foreground">This will reset the status, seen count, and guess stats for every card in your deck.</p>
          <Button onClick={onClearSummary} variant="outline" className="w-full">
            Clear This Summary
          </Button>
          <p className="text-xs text-muted-foreground">This will clear the results from your last session(s), but will not affect card progress.</p>
        </CardContent>
      </Card>
    </div>
  );
}