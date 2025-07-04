"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useFlashcards, CardData } from '@/hooks/use-flashcards'; // Updated import
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
  const { cards, loading, isLoggedInMode, handleAddCard, handleDeleteCard, handleUpdateCard, handleAnswerFeedback } = useFlashcards(); // Updated hook and functions
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

    // No firebaseError state needed anymore, use isLoggedInMode for guest messaging
    // if (firebaseError) {
    //   return (
    //     <div className="text-center text-destructive p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
    //       <h3 className="text-xl font-bold mb-4">Firebase Connection Error!</h3>
    //       <p className="mb-6">
    //         There was an issue connecting to the Firebase database or authenticating. Please ensure your Firebase environment variables are correctly set.
    //       </p>
    //       <p className="text-sm text-muted-foreground">
    //         Check `NEXT_PUBLIC_FIREBASE_CONFIG` and `NEXT_PUBLIC_FIREBASE_APP_ARTIFACT_ID` in your `.env.local` file.
    //       </p>
    //     </div>
    //   );
    // }

    switch (currentMode) {
      case 'manage':
        return (
          <div className="space-y-6">
            <FlashcardForm
              onSave={handleAddCard} // Use handleAddCard from useFlashcards
              editingCard={editingCard}
              onCancel={handleCancelEdit}
              isCurrentRoomWritable={isCurrentRoomWritable}
            />
            <FlashcardList
              flashcards={cards} // Use cards from useFlashcards
              onEdit={handleEditClick}
              onDelete={handleDeleteCard} // Use handleDeleteCard from useFlashcards
              isCurrentRoomWritable={isCurrentRoomWritable}
            />
          </div>
        );
      case 'flashcards':
        return <FlashcardStudy flashcards={cards} />; // Use cards from useFlashcards
      case 'learn':
        return <LearnMode flashcards={cards} handleAnswerFeedback={handleAnswerFeedback} goToSummary={goToSummary} isCurrentRoomWritable={isCurrentRoomWritable} />;
      case 'test':
        return <TestMode flashcards={cards} handleAnswerFeedback={handleAnswerFeedback} goToSummary={goToSummary} isCurrentRoomWritable={isCurrentRoomWritable} />;
      case 'summary':
        return <SummaryMode summaryData={summaryData} summaryModeSource={summaryModeSource} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-foreground text-center">Flashcard Widget</h1>

      {!isLoggedInMode && ( // Display guest mode message if not logged in
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
          disabled={!summaryData}
        >
          Summary
        </Button>
      </div>

      {renderContent()}
    </div>
  );
}