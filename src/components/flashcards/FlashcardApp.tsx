"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useFlashcards, CardData } from '@/hooks/use-flashcards';
import { useSupabase } from '@/integrations/supabase/auth';
import { FlashcardForm } from './FlashcardForm';
import { FlashcardList } from './FlashcardList';
import { FlashcardStudy } from './FlashcardStudy';
import { LearnMode } from './LearnMode';
import { TestMode } from './TestMode';
import { SummaryMode } from './SummaryMode';
import { toast } from 'sonner';

type FlashcardMode = 'manage' | 'flashcards' | 'learn' | 'test' | 'summary';

interface FlashcardAppProps {
  isCurrentRoomWritable: boolean;
}

export function FlashcardApp({ isCurrentRoomWritable }: FlashcardAppProps) {
  const { cards, loading, isLoggedInMode, handleAddCard, handleDeleteCard, handleUpdateCard, handleAnswerFeedback, markCardAsSeen, incrementCardSeenCount, handleResetProgress } = useFlashcards();
  const { session } = useSupabase();
  const [currentMode, setCurrentMode] = useState<FlashcardMode>('manage');
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryModeSource, setSummaryModeSource] = useState<'learn' | 'test' | null>(null);

  // Function to navigate to summary mode
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div>
              <FlashcardForm
                onSave={handleAddCard}
                editingCard={editingCard}
                onCancel={handleCancelEdit}
                isCurrentRoomWritable={isCurrentRoomWritable}
              />
              <Card className="w-full bg-card backdrop-blur-xl border-white/20 mt-6">
                <CardHeader>
                  <CardTitle>Deck Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleResetProgress}
                    variant="destructive"
                    className="w-full"
                    disabled={!isCurrentRoomWritable}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Reset All Progress & Stats
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">This will reset the status, seen count, and guess statistics for all cards in this deck.</p>
                </CardContent>
              </Card>
            </div>
            <FlashcardList
              flashcards={cards}
              onEdit={handleEditClick}
              onDelete={handleDeleteCard}
              isCurrentRoomWritable={isCurrentRoomWritable}
              session={session}
            />
          </div>
        );
      case 'flashcards':
        return <FlashcardStudy flashcards={cards} />;
      case 'learn':
        return <LearnMode flashcards={cards} handleAnswerFeedback={handleAnswerFeedback} markCardAsSeen={markCardAsSeen} goToSummary={goToSummary} isCurrentRoomWritable={isCurrentRoomWritable} />;
      case 'test':
        return <TestMode flashcards={cards} handleAnswerFeedback={handleAnswerFeedback} markCardAsSeen={markCardAsSeen} goToSummary={goToSummary} isCurrentRoomWritable={isCurrentRoomWritable} />;
      case 'summary':
        return <SummaryMode summaryData={summaryData} summaryModeSource={summaryModeSource} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-foreground text-center">Flashcard Widget</h1>

      {!isLoggedInMode && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardContent className="text-center text-sm text-muted-foreground p-2">
            You are currently browsing flashcards as a guest. Your cards are saved locally in your browser. Log in to save them to your account!
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap justify-center gap-3 mb-4 w-full">
        <Button
          onClick={() => { setCurrentMode('manage'); setEditingCard(null); }}
          variant={currentMode === 'manage' ? 'default' : 'outline'}
        >
          Manage Cards
        </Button>
        <Button
          onClick={() => setCurrentMode('flashcards')}
          variant={currentMode === 'flashcards' ? 'default' : 'outline'}
        >
          Study Cards
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