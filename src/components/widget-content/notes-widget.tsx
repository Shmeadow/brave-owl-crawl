"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddEntryForm } from "@/components/add-entry-form"; // Updated import
import { EntryList } from "@/components/entry-list"; // Updated import
import { useNotes, NoteData } from "@/hooks/use-notes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { AnnotationsSidebar } from "@/components/annotations-sidebar"; // Import the new sidebar
import { toast } from "sonner"; // Import toast

type NoteViewMode = 'all' | 'note'; // Removed 'journal' as it's now separate

interface NotesWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function NotesWidget({ isCurrentRoomWritable }: NotesWidgetProps) {
  const {
    notes,
    loading,
    isLoggedInMode,
    handleAddNote,
    handleDeleteNote,
    handleToggleStar,
    handleUpdateNoteContent,
    handleUpdateNoteTitle,
  } = useNotes();
  const [viewMode, setViewMode] = useState<NoteViewMode>('all'); // Default to 'all' notes
  const [activeNoteForAnnotations, setActiveNoteForAnnotations] = useState<string | null>(null); // State for selected note's annotations

  const noteListRef = useRef<HTMLDivElement>(null); // Ref for the note list container

  const filteredNotes = useMemo(() => {
    // For notes widget, 'all' means all notes (which is all data from useNotes hook)
    // The 'note' type filter is handled by the useNotes hook itself.
    return notes;
  }, [notes]);

  const handleSelectNoteForAnnotations = useCallback((noteId: string | null) => {
    setActiveNoteForAnnotations(noteId);
  }, []);

  const handleJumpToHighlight = useCallback((highlightId: string) => {
    toast.info(`Attempting to scroll to highlight: ${highlightId}`);
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center gap-6 p-4">
      <h1 className="text-3xl font-bold text-foreground text-center">Your Notes</h1>

      {!isLoggedInMode && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardContent className="text-center text-sm text-muted-foreground p-2">
            You are currently browsing as a guest. Your notes are saved locally. Log in to save them to your account!
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-full">
        {/* Left Column: Add New Entry Form */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <AddEntryForm
            onAddEntry={handleAddNote} // Use handleAddNote
            isCurrentRoomWritable={isCurrentRoomWritable}
            defaultType={'note'} // Always 'note'
            showTypeToggle={false} // Hide type toggle
          />
        </div>

        {/* Right Columns: Note List and Annotations Sidebar */}
        <div className={`md:col-span-1 flex flex-col gap-6 ${activeNoteForAnnotations ? 'md:grid md:grid-cols-1' : ''}`}>
          <Card className="w-full flex-1 bg-card backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle>Your Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* Removed ToggleGroup for view mode as it's only notes now */}
              <EntryList
                entries={filteredNotes} // Use filteredNotes
                onToggleStar={handleToggleStar}
                onDelete={handleDeleteNote}
                isCurrentRoomWritable={isCurrentRoomWritable}
                onUpdateEntryContent={handleUpdateNoteContent}
                onUpdateEntryTitle={handleUpdateNoteTitle}
                onSelectEntryForAnnotations={handleSelectNoteForAnnotations}
                activeEntryForAnnotations={activeNoteForAnnotations}
              />
            </CardContent>
          </Card>
          {activeNoteForAnnotations && (
            <div className="flex-1 flex-shrink-0">
              <AnnotationsSidebar
                noteId={activeNoteForAnnotations}
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