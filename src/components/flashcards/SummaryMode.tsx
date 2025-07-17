"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, RefreshCcw, BookOpen, Brain, BarChart2, ListTodo, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardData } from '@/hooks/flashcards/types';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface DetailedResult {
  term: string;
  correctDefinition: string;
  userAnswer: string | null;
  isCorrect: boolean;
  closeness?: number;
  cardId: string;
  cardData: CardData;
  source: 'learn' | 'test';
  sessionId: string;
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
  learnModeStats: { total: number; correct: number; accuracy: number; };
  testModeStats: { total: number; correct: number; accuracy: number; };
  statusBreakdown: { [status: string]: number; };
  topMissedCards: { card: CardData; incorrectCount: number; }[];
}

interface SummaryModeProps {
  summaryData: SummaryData | null;
  onResetProgress: () => void;
  onClearSummary: () => void;
}

export function SummaryMode({ summaryData, onResetProgress, onClearSummary }: SummaryModeProps) {
  const sessions = useMemo(() => {
    if (!summaryData || !summaryData.detailedResults) return [];

    const groups: { [key: string]: DetailedResult[] } = {};
    summaryData.detailedResults.forEach(result => {
      if (!groups[result.sessionId]) {
        groups[result.sessionId] = [];
      }
      groups[result.sessionId].push(result);
    });

    return Object.entries(groups).map(([sessionId, results]) => {
      const uniqueResultsMap = new Map<string, DetailedResult>();
      // Get the last result for each card within the session
      results.forEach(r => uniqueResultsMap.set(r.cardId, r));
      const uniqueResults = Array.from(uniqueResultsMap.values());

      return {
        id: sessionId,
        startTime: new Date(sessionId),
        results: uniqueResults.sort((a, b) => a.term.localeCompare(b.term)),
        correctCount: uniqueResults.filter(r => r.isCorrect).length,
        totalCount: uniqueResults.length,
      };
    }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Newest session first
  }, [summaryData]);

  if (!summaryData || sessions.length === 0) {
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

  const overallCorrect = summaryData.score;
  const overallTotal = summaryData.totalAttempted;
  const overallAccuracy = overallTotal > 0 ? parseFloat(((overallCorrect / overallTotal) * 100).toFixed(2)) : 0;

  const renderProgressBar = (value: number, max: number, label: string, colorClass: string) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-muted-foreground">{value} / {max}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div className={cn("h-2.5 rounded-full", colorClass)} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  const renderAccuracyBar = (accuracy: number, label: string) => {
    const colorClass = accuracy >= 75 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-muted-foreground">{accuracy}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div className={cn("h-2.5 rounded-full", colorClass)} style={{ width: `${accuracy}%` }}></div>
        </div>
      </div>
    );
  };

  const renderSessionResults = (results: DetailedResult[]) => (
    <ul className="space-y-2 pt-2">
      {results.map((result, index) => (
        <li key={`${result.cardId}-${index}`} className={cn(
          "p-3 rounded-md shadow-sm border",
          result.isCorrect ? 'bg-green-50/70 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/30' : 'bg-red-50/70 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/30'
        )}>
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-md text-foreground">Term: <span className="text-primary">{result.term}</span></p>
            {result.cardData.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
          </div>
          <p className="text-sm text-muted-foreground">Your Answer: <span className={cn(result.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>{result.userAnswer || '[No Answer]'}</span></p>
          {!result.isCorrect && <p className="text-sm text-muted-foreground">Correct Answer: <span className="font-medium text-primary">{result.correctDefinition}</span></p>}
        </li>
      ))}
    </ul>
  );

  const totalCardsInDeck = Object.values(summaryData.statusBreakdown).reduce((sum, count) => sum + count, 0);

  return (
    <div className="w-full space-y-8">
      <Card className="bg-card backdrop-blur-xl border-white/20 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg w-full">
        <CardHeader className="p-0 pb-6">
          <CardTitle className="text-3xl font-bold text-foreground text-center">
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-6">
            <div className="bg-muted p-4 rounded-lg shadow-sm border border-border">
              <p className="text-lg font-semibold text-foreground">Total Cards Reviewed</p>
              <p className="text-4xl font-bold text-primary">{overallTotal}</p>
            </div>
            <div className="bg-green-100/70 dark:bg-green-900/30 p-4 rounded-lg shadow-sm border border-green-200/50 dark:border-green-800/50">
              <p className="text-lg font-semibold text-green-800 dark:text-green-300">Correct Answers</p>
              <p className="text-4xl font-bold text-green-900 dark:text-green-200">{overallCorrect}</p>
            </div>
            <div className="bg-red-100/70 dark:bg-red-900/30 p-4 rounded-lg shadow-sm border border-red-200/50 dark:border-red-800/50">
              <p className="text-lg font-semibold text-red-800 dark:text-red-300">Incorrect Answers</p>
              <p className="text-4xl font-bold text-red-900 dark:text-red-200">{overallTotal - overallCorrect}</p>
            </div>
          </div>
          <div className="text-center text-2xl font-bold text-foreground mb-10">
            Overall Accuracy: {overallAccuracy}%
          </div>

          <h3 className="text-xl font-bold text-foreground mb-4 text-center flex items-center justify-center gap-2">
            <BarChart2 className="h-5 w-5" /> Performance Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Card className="p-4 bg-muted/50 border border-border">
              <CardTitle className="text-lg mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-blue-500" /> Learn Mode</CardTitle>
              {renderProgressBar(summaryData.learnModeStats.correct, summaryData.learnModeStats.total, "Correct", "bg-blue-500")}
              {renderAccuracyBar(summaryData.learnModeStats.accuracy, "Accuracy")}
            </Card>
            <Card className="p-4 bg-muted/50 border border-border">
              <CardTitle className="text-lg mb-3 flex items-center gap-2"><ListTodo className="h-5 w-5 text-purple-500" /> Test Mode</CardTitle>
              {renderProgressBar(summaryData.testModeStats.correct, summaryData.testModeStats.total, "Correct", "bg-purple-500")}
              {renderAccuracyBar(summaryData.testModeStats.accuracy, "Accuracy")}
            </Card>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-4 text-center flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5" /> Card Status Distribution
          </h3>
          <div className="space-y-3 mb-10">
            {Object.entries(summaryData.statusBreakdown).map(([status, count]) => (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{status}</span>
                  <span className="text-muted-foreground">{count} / {totalCardsInDeck} cards</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className={cn("h-2.5 rounded-full", {
                      'bg-green-500': status === 'Mastered',
                      'bg-blue-500': status === 'Advanced',
                      'bg-purple-500': status === 'Intermediate',
                      'bg-orange-500': status === 'Beginner',
                      'bg-red-500': status === 'Learning',
                    })}
                    style={{ width: `${(count / totalCardsInDeck) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {summaryData.topMissedCards.length > 0 && (
            <>
              <h3 className="text-xl font-bold text-foreground mb-4 text-center flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" /> Top Missed Cards
              </h3>
              <ul className="space-y-3 mb-10">
                {summaryData.topMissedCards.map((item, index) => (
                  <li key={item.card.id} className="p-3 rounded-md bg-red-50/70 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
                    <p className="font-semibold text-md text-foreground">
                      {index + 1}. {item.card.front}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Incorrectly answered: <span className="font-medium text-red-700 dark:text-red-400">{item.incorrectCount} times</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Correct Answer: <span className="font-medium text-primary">{item.card.back}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="text-xl font-bold text-foreground mb-4 text-center">Session History</h3>
          {sessions.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <Accordion type="single" collapsible className="w-full" defaultValue={sessions[0]?.id}>
                {sessions.map((session, index) => (
                  <AccordionItem value={session.id} key={session.id}>
                    <AccordionTrigger>
                      <div className="flex justify-between w-full pr-4">
                        <span>Session #{sessions.length - index} ({session.startTime.toLocaleString()})</span>
                        <span>Score: {session.correctCount}/{session.totalCount}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {renderSessionResults(session.results)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center">No session data to display.</p>
          )}
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