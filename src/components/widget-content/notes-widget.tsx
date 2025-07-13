"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddNoteForm } from "@/components/add-note-form";
import { NoteList } from "@/components/note-list";
import { useNotes, NoteData } from "@/hooks/use-notes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type NoteViewMode = 'all' | 'note' | 'journal';

interface NotesWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function NotesWidget({ isCurrentRoomWritable }: NotesWidgetProps) {
  const { notes, loading, isLoggedInMode, handleAddNote, handleDeleteNote, handleToggleStar } = useNotes();
  const [viewMode, setViewMode] = useState<NoteViewMode>('all');

  const filteredNotes = useMemo(() => {
    if (viewMode === 'all') {
      return notes;
    }
    return notes.filter(note => note.type === viewMode);
  }, [notes, viewMode]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle>Add New Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <AddNoteForm
              onAddNote={handleAddNote}
              isCurrentRoomWritable={isCurrentRoomWritable}
              defaultType={viewMode === 'journal' ? 'journal' : 'note'} // Default type based on view mode
            />
          </CardContent>
        </Card>

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
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
            />
          </CardContent>
        </Card>

        {!isLoggedInMode && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            You are currently browsing as a guest. Your entries are saved locally in your browser. Log in to save them to your account!
          </p>
        )}
      </div>
    </div>
  );
}