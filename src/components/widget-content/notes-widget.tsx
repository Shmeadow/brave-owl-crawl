"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddNoteForm } from "@/components/add-note-form";
import { NoteList } from "@/components/note-list";
import { useNotes, NoteData } from "@/hooks/use-notes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { AnnotationsSidebar } from "@/components/annotations-sidebar"; // Import the new sidebar
import { toast } from "sonner"; // Import toast

type NoteViewMode = 'all' | 'note' | 'journal';

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
  const [viewMode, setViewMode] = useState<NoteViewMode>('all');
  const [activeNoteForAnnotations, setActiveNoteForAnnotations] = useState<string | null>(null); // State for selected note's annotations

  const noteListRef = useRef<HTMLDivElement>(null); // Ref for the note list container

  const filteredNotes = useMemo(() => {
    if (viewMode === 'all') {
      return notes;
    }
    return notes.filter(note => note.type === viewMode);
  }, [notes, viewMode]);

  const handleSelectNoteForAnnotations = useCallback((noteId: string | null) => {
    setActiveNoteForAnnotations(noteId);
  }, []);

  const handleJumpToHighlight = useCallback((highlightId: string) => {
    // This function needs to find the specific RichTextEditor instance and call its scroll method.
    // Since RichTextEditor is rendered inside NoteItem, we need a way to access it.
    // A more robust solution would involve a context or a ref passed down.
    // For now, this is a placeholder. The RichTextEditor itself needs to expose a method.
    // The `onEditorReady` prop in RichTextEditor can be used to store editor instances.

    // For demonstration, we'll log it. In a real app, you'd have a map of editor instances by noteId.
    // editorInstances.get(activeNoteForAnnotations)?.scrollIntoView(highlightId);
    toast.info(`Attempting to scroll to highlight: ${highlightId}`);
    // A more advanced implementation would involve storing refs to individual RichTextEditor instances
    // in a map (e.g., `editorRefs.current[noteId] = editorInstance`) and then calling a method on that instance.
    // This is beyond the current scope of simple component updates.
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
      <h1 className="text-3xl font-bold text-foreground text-center">Your Notes & Journal</h1>

      {!isLoggedInMode && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardContent className="text-center text-sm text-muted-foreground p-2">
            You are currently browsing as a guest. Your entries are saved locally. Log in to save them to your account!
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-full">
        {/* Left/Middle Columns: Note List and Annotations Sidebar */}
        <div className={`md:col-span-2 flex flex-col gap-6 ${activeNoteForAnnotations ? 'md:grid md:grid-cols-2' : ''}`}>
          <Card className="w-full flex-1 bg-card backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle>Your Entries</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Label htmlFor="note-view-mode" className="sr-only">View Mode</Label>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value: NoteViewMode) => value && setViewMode(value)}
                className="grid grid-cols-3 mb-4"
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="note">Notes</ToggleGroupItem>
                <ToggleGroupItem value="journal">Journal</ToggleGroupItem>
              </ToggleGroup>
              <NoteList
                notes={filteredNotes}
                onToggleStar={handleToggleStar}
                onDelete={handleDeleteNote}
                isCurrentRoomWritable={isCurrentRoomWritable}
                onUpdateNoteContent={handleUpdateNoteContent}
                onUpdateNoteTitle={handleUpdateNoteTitle}
                onSelectNoteForAnnotations={handleSelectNoteForAnnotations}
                activeNoteForAnnotations={activeNoteForAnnotations}
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

        {/* Right Column: Add New Entry Form */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <AddNoteForm
            onAddNote={handleAddNote}
            isCurrentRoomWritable={isCurrentRoomWritable}
            defaultType={viewMode === 'journal' ? 'journal' : 'note'}
          />
        </div>
      </div>
    </div>
  );
}