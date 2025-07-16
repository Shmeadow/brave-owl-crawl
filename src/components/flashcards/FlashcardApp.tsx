"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useFlashcards, CardData } from '@/hooks/use-flashcards';
import { useSupabase } from '@/integrations/supabase/auth';
import { ManageMode } from './ManageMode';
import { LearnMode } from './LearnMode';
import { TestMode } from './TestMode';
import { SummaryMode, DetailedResult, SummaryData } from './SummaryMode';
import { useFlashcardCategories } from '@/hooks/flashcards/useFlashcardCategories';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFlashcardSize, FlashcardSize } from '@/hooks/use-flashcard-size'; // Import new hook
import { GuestWarningBar } from '@/components/guest-warning-bar'; // Import new component

type FlashcardMode = 'manage' | 'learn' | 'test' | 'summary';

const SESSION_HISTORY_KEY = 'flashcard_session_history';

export function FlashcardApp() {
  const { cards, loading, isLoggedInMode, handleAddCard, handleDeleteCard, handleUpdateCard, handleAnswerFeedback: baseHandleAnswerFeedback, handleResetProgress, handleBulkAddCards, handleUpdateCardCategory, handleBulkDelete, handleBulkMove, handleGradeCard } = useFlashcards();
  const { categories, addCategory, deleteCategory, updateCategory } = useFlashcardCategories();
  const { session } = useSupabase();
  const [currentMode, setCurrentMode] = useState<FlashcardMode>('manage');
  const [sessionHistory, setSessionHistory] = useState<DetailedResult[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [testType, setTestType] = useState<'text' | 'choices'>('text');
  const { size: flashcardSize, setSize: setFlashcardSize, loading: sizeLoading } = useFlashcardSize(); // Use new hook

  // Load session history from local storage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(SESSION_HISTORY_KEY);
      if (savedHistory) {
        setSessionHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load session history from local storage", error);
    }
  }, []);

  // Save session history to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(sessionHistory));
    } catch (error) {
      console.error("Failed to save session history to local storage", error);
    }
  }, [sessionHistory]);

  // Start a new session when entering learn/test mode
  useEffect(() => {
    if (currentMode === 'learn' || currentMode === 'test') {
      setCurrentSessionId(new Date().toISOString());
    } else {
      setCurrentSessionId(null); // Clear session ID when not in a learning/testing mode
    }
  }, [currentMode]);

  const handleClearSummary = useCallback(() => {
    setSessionHistory([]);
    localStorage.removeItem(SESSION_HISTORY_KEY);
    toast.success("Session summary has been cleared.");
  }, []);

  const handleGradeCardWrapper = useCallback((cardId: string, grade: 'Easy' | 'Good' | 'Hard' | 'Again') => {
    if (!currentSessionId) return;
    handleGradeCard(cardId, grade); // The original mutation

    const card = cards.find(c => c.id === cardId);
    if (card) {
        const result: DetailedResult = {
            term: card.front,
            correctDefinition: card.back,
            userAnswer: `Graded as ${grade}`,
            isCorrect: grade === 'Easy' || grade === 'Good',
            cardId: card.id,
            cardData: card,
            source: 'learn',
            sessionId: currentSessionId,
        };
        setSessionHistory(prev => [...prev, result]);
    }
  }, [handleGradeCard, cards, currentSessionId]);

  const augmentedHandleAnswerFeedback = useCallback((cardId: string, isCorrect: boolean, userAnswer: string | null, source: 'learn' | 'test') => {
    if (!currentSessionId) return;
    baseHandleAnswerFeedback(cardId, isCorrect);

    const card = cards.find(c => c.id === cardId);
    if (card) {
        const result: DetailedResult = {
            term: card.front,
            correctDefinition: card.back,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
            cardId: card.id,
            cardData: card,
            source: source,
            sessionId: currentSessionId,
        };
        setSessionHistory(prev => [...prev, result]);
    }
  }, [baseHandleAnswerFeedback, cards, currentSessionId]);

  const generateSummaryData = useCallback((): SummaryData | null => {
    if (sessionHistory.length === 0) return null;

    const lastResultsMap = new Map<string, DetailedResult>();
    sessionHistory.forEach(result => {
        lastResultsMap.set(result.cardId, result);
    });
    const uniqueDetailedResults = Array.from(lastResultsMap.values());

    const correctCount = uniqueDetailedResults.filter(r => r.isCorrect).length;
    
    const detailedResultsWithLatestCardData = uniqueDetailedResults.map(result => {
        const latestCardData = cards.find(c => c.id === result.cardId);
        return {
            ...result,
            cardData: latestCardData || result.cardData,
        };
    }).reverse();

    const testResults = sessionHistory.filter(r => r.source === 'test');
    const testCorrectCount = testResults.filter(r => r.isCorrect).length;
    const testAccuracy = testResults.length > 0 ? (testCorrectCount / testResults.length) * 100 : 0;

    return {
        totalAttempted: uniqueDetailedResults.length,
        score: correctCount,
        detailedResults: sessionHistory, // Pass the full history for grouping
        testAnalysis: {
            results: testResults,
            accuracy: testAccuracy,
            total: testResults.length,
            correct: testCorrectCount,
        }
    };
  }, [sessionHistory, cards]);

  const goToSummary = useCallback(() => {
    setCurrentMode('summary');
  }, []);

  const handleUpdateCardWrapper = (cardData: { id?: string; front: string; back: string; category_id?: string | null }) => {
    if (cardData.id) {
      const { id, ...updatedData } = cardData;
      handleUpdateCard(id, updatedData);
    }
  };

  const renderContent = () => {
    if (loading || sizeLoading) {
      return (
        <div className="flex justify-center items-center h-full text-lg text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading flashcards...
        </div>
      );
    }

    switch (currentMode) {
      case 'manage':
        return (
          <ManageMode
            cards={cards}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onUpdateCard={handleUpdateCardWrapper}
            onBulkImport={handleBulkAddCards}
            categories={categories}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onUpdateCategory={updateCategory}
            onUpdateCardCategory={handleUpdateCardCategory}
            flashcardSize={flashcardSize} // Pass flashcardSize to ManageMode
            setFlashcardSize={setFlashcardSize} // Pass setFlashcardSize to ManageMode
          />
        );
      case 'learn':
        return <LearnMode flashcards={cards} onGradeCard={handleGradeCardWrapper} goToSummary={goToSummary} flashcardSize={flashcardSize} setFlashcardSize={setFlashcardSize} />;
      case 'test':
        return <TestMode flashcards={cards} onAnswer={(cardId, isCorrect, userAnswer) => augmentedHandleAnswerFeedback(cardId, isCorrect, userAnswer, 'test')} onQuit={() => setCurrentMode('manage')} testType={testType} flashcardSize={flashcardSize} setFlashcardSize={setFlashcardSize} />;
      case 'summary':
        return <SummaryMode summaryData={generateSummaryData()} onResetProgress={handleResetProgress} onClearSummary={handleClearSummary} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-foreground text-center">Flashcard Deck</h1>
      
      {/* Removed the old guest mode Card */}

      <div className="flex flex-wrap justify-center gap-3 mb-4 w-full">
        <Button
          onClick={() => setCurrentMode('manage')}
          variant={currentMode === 'manage' ? 'default' : 'outline'}
        >
          Manage Deck
        </Button>
        <Button
          onClick={() => setCurrentMode('learn')}
          variant={currentMode === 'learn' ? 'default' : 'outline'}
        >
          Learn Mode
        </Button>
        <Button
          onClick={() => setCurrentMode('test')}
          variant={currentMode === 'test' ? 'default' : 'outline'}
        >
          Test Mode
        </Button>
        <Button
          onClick={() => setCurrentMode('summary')}
          variant={currentMode === 'summary' ? 'default' : 'outline'}
        >
          Summary
        </Button>
      </div>

      {currentMode === 'test' && (
        <Card className="w-full max-w-md">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Test Type</Label>
              <ToggleGroup type="single" value={testType} onValueChange={(value) => value && setTestType(value as 'text' | 'choices')} disabled={cards.length < 4} className="mt-1 grid grid-cols-2">
                  <ToggleGroupItem value="text">Text Input</ToggleGroupItem>
                  <ToggleGroupItem value="choices">Multiple Choice</ToggleGroupItem>
              </ToggleGroup>
              {cards.length < 4 && <p className="text-xs text-muted-foreground mt-1">Multiple choice requires at least 4 cards.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {renderContent()}

      {/* New Guest Warning Bar */}
      {!isLoggedInMode && <GuestWarningBar />}
    </div>
  );
}