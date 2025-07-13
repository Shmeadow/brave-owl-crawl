"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddEntryForm } from "@/components/add-entry-form"; // Reusing generic form
import { EntryList } from "@/components/entry-list"; // Reusing generic list
import { useJournal, JournalEntryData } from "@/hooks/use-journal"; // New hook for journal
import { Loader2 } from "lucide-react";
import { AnnotationsSidebar } from "@/components/annotations-sidebar"; // Annotations still apply
import { toast } from "sonner";

interface JournalWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function JournalWidget({ isCurrentRoomWritable }: JournalWidgetProps) {
  const {
    journalEntries,
    loading,
    isLoggedInMode,
    handleAddJournalEntry,
    handleDeleteJournalEntry,
    handleToggleStarJournalEntry,
    handleUpdateJournalEntryContent,
    handleUpdateJournalEntryTitle,
  } = useJournal();
  const [activeEntryForAnnotations, setActiveEntryForAnnotations] = useState<string | null>(null);

  const handleSelectEntryForAnnotations = useCallback((entryId: string | null) => {
    setActiveEntryForAnnotations(entryId);
  }, []);

  const handleJumpToHighlight = useCallback((highlightId: string) => {
    toast.info(`Attempting to scroll to highlight: ${highlightId}`);
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading journal entries...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center gap-6 p-4">
      <h1 className="text-3xl font-bold text-foreground text-center">Your Journal</h1>

      {!isLoggedInMode && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardContent className="text-center text-sm text-muted-foreground p-2">
            You are currently browsing as a guest. Your journal entries are saved locally. Log in to save them to your account!
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-full">
        {/* Left Column: Add New Journal Entry Form */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <AddEntryForm
            onAddEntry={handleAddJournalEntry}
            isCurrentRoomWritable={isCurrentRoomWritable}
            defaultType={'journal'} // Always 'journal'
            showTypeToggle={false} // Hide type toggle
          />
        </div>

        {/* Right Columns: Journal Entry List and Annotations Sidebar */}
        <div className={`md:col-span-1 flex flex-col gap-6 ${activeEntryForAnnotations ? 'md:grid md:grid-cols-1' : ''}`}>
          <Card className="w-full flex-1 bg-card backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle>Your Journal Entries</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <EntryList
                entries={journalEntries}
                onToggleStar={handleToggleStarJournalEntry}
                onDelete={handleDeleteJournalEntry}
                isCurrentRoomWritable={isCurrentRoomWritable}
                onUpdateEntryContent={handleUpdateJournalEntryContent}
                onUpdateEntryTitle={handleUpdateJournalEntryTitle}
                onSelectEntryForAnnotations={handleSelectEntryForAnnotations}
                activeEntryForAnnotations={activeEntryForAnnotations}
              />
            </CardContent>
          </Card>
          {activeEntryForAnnotations && (
            <div className="flex-1 flex-shrink-0">
              <AnnotationsSidebar
                noteId={activeEntryForAnnotations}
                onJumpToHighlight={handleJumpToHighlight}
                isCurrentRoomWritable={isCurrentRoomWritable}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}