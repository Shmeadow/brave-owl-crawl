"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useFlashcards, CardData } from '@/hooks/use-flashcards';
import { useSupabase } from '@/integrations/supabase/auth';
import { ManageMode } from './ManageMode';
import { LearnMode } from './LearnMode';
import { TestMode } from './TestMode';
import { SummaryMode, DetailedResult, SummaryData } from './SummaryMode';
import { useFlashcardCategories } from '@/hooks/flashcards/useFlashcardCategories';

type FlashcardMode = 'manage' | 'learn' | 'test' | 'summary';

export function FlashcardApp() {
  const { cards, loading, isLoggedInMode, handleAddCard, handleDeleteCard, handleUpdateCard, handleAnswerFeedback: baseHandleAnswerFeedback, handleResetProgress, handleBulkAddCards, handleUpdateCardCategory } = useFlashcards();
  const { categories, addCategory, deleteCategory, updateCategory } = useFlashcardCategories();
  const { session } = useSupabase();
  const [currentMode, setCurrentMode] = useState<FlashcardMode>('manage');
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryModeSource, setSummaryModeSource] = useState<'learn' | 'test' | null>(null);
  const [sessionHistory, setSessionHistory] = useState<DetailedResult[]>([]);

  const augmentedHandleAnswerFeedback = useCallback((cardId: string, isCorrect: boolean, userAnswer: string | null, source: 'learn' | 'test') => {
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
        };
        setSessionHistory(prev => [...prev, result]);
    }
  }, [baseHandleAnswerFeedback, cards]);

  const generateSummaryData = useCallback((): SummaryData | null => {
    if (sessionHistory.length === 0) return null;
    const correctCount = sessionHistory.filter(r => r.isCorrect).length;
    
    const detailedResultsWithLatestCardData = sessionHistory.map(result => {
        const latestCardData = cards.find(c => c.id === result.cardId);
        return {
            ...result,
            cardData: latestCardData || result.cardData,
        };
    }).reverse();

    return {
        type: 'test',
        totalAttempted: sessionHistory.length,
        score: correctCount,
        detailedResults: detailedResultsWithLatestCardData,
    };
  }, [sessionHistory, cards]);

  const goToSummary = useCallback((data: any, source: 'learn' | 'test') => {
    setSummaryData(data);
    setSummaryModeSource(source);
    setCurrentMode('summary');
  }, []);

  const handleEditClick = (card: CardData) => {
    setEditingCard(card);
    setCurrentMode('manage');
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
  };

  const renderContent = () => {
    if (loading) {
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
            editingCard={editingCard}
            onAddCard={handleAddCard}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onEdit={handleEditClick}
            onCancelEdit={handleCancelEdit}
            onResetProgress={handleResetProgress}
            onBulkImport={handleBulkAddCards}
            categories={categories}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onUpdateCategory={updateCategory}
            onUpdateCardCategory={handleUpdateCardCategory}
          />
        );
      case 'learn':
        return <LearnMode flashcards={cards} handleAnswerFeedback={augmentedHandleAnswerFeedback} goToSummary={goToSummary} />;
      case 'test':
        return <TestMode flashcards={cards} handleAnswerFeedback={augmentedHandleAnswerFeedback} goToSummary={goToSummary} />;
      case 'summary':
        return <SummaryMode summaryData={generateSummaryData()} summaryModeSource={summaryModeSource} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-foreground text-center">Flashcard Deck</h1>
      
      {!isLoggedInMode && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardContent className="text-center text-sm text-muted-foreground p-2">
            You are currently browsing as a guest. Your cards are saved locally. Log in to save them to your account!
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap justify-center gap-3 mb-4 w-full">
        <Button
          onClick={() => { setCurrentMode('manage'); setEditingCard(null); }}
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

      {renderContent()}
    </div>
  );
}