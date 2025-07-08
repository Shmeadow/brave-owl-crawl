"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, RefreshCcw } from 'lucide-react';
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
      <Card className="text-center p-8 bg-card/40 backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">No summary available.</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete a session in Learn or Test Mode to see a summary.</p>
        </CardContent>
      </Card>
    );
  }

  const overallCorrect = sessions.reduce((sum, s) => sum + s.correctCount, 0);
  const overallTotal = sessions.reduce((sum, s) => sum + s.totalCount, 0);
  const overallAccuracy = overallTotal > 0 ? parseFloat(((overallCorrect / overallTotal) * 100).toFixed(2)) : 0;

  const renderSessionResults = (results: DetailedResult[]) => (
    <ul className="space-y-2 pt-2">
      {results.map((result, index) => (
        <li key={`${result.cardId}-${index}`} className={cn(
          "p-3 rounded-md shadow-sm border",
          result.isCorrect ? 'bg-green-500/10 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/30' : 'bg-red-500/10 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/30'
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

  return (
    <div className="w-full space-y-6">
      <Card className="bg-card/40 backdrop-blur-xl border-white/20 p-6 rounded-xl shadow-lg w-full">
        <CardHeader className="p-0 pb-6">
          <CardTitle className="text-3xl font-bold text-foreground text-center">
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
            <div className="bg-muted/40 p-4 rounded-lg shadow-sm border border-border">
              <p className="text-lg font-semibold text-foreground">Total Cards Reviewed</p>
              <p className="text-4xl font-bold text-primary">{overallTotal}</p>
            </div>
            <div className="bg-green-500/20 p-4 rounded-lg shadow-sm border border-green-200/50 dark:border-green-800/50">
              <p className="text-lg font-semibold text-green-800 dark:text-green-300">Correct Answers</p>
              <p className="text-4xl font-bold text-green-900 dark:text-green-200">{overallCorrect}</p>
            </div>
            <div className="bg-red-500/20 p-4 rounded-lg shadow-sm border border-red-200/50 dark:border-red-800/50">
              <p className="text-lg font-semibold text-red-800 dark:text-red-300">Incorrect Answers</p>
              <p className="text-4xl font-bold text-red-900 dark:text-red-200">{overallTotal - overallCorrect}</p>
            </div>
          </div>
          <div className="text-center text-2xl font-bold text-foreground mb-8">
            Overall Accuracy: {overallAccuracy}%
          </div>
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
      <Card className="bg-card/40 backdrop-blur-xl border-white/20">
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