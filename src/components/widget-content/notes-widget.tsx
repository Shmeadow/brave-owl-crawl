"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddNoteForm } from "@/components/add-note-form";
import { NoteList } from "@/components/note-list";
import { useNotes } from "@/hooks";

interface NotesWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function NotesWidget({ isCurrentRoomWritable }: NotesWidgetProps) {
  const { notes, loading, isLoggedInMode, handleAddNote, handleDeleteNote, handleToggleStar } = useNotes();

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Add New Note</CardTitle>
          </CardHeader>
          <CardContent>
            <AddNoteForm onAddNote={handleAddNote} isCurrentRoomWritable={isCurrentRoomWritable} />
          </CardContent>
        </Card>

        <NoteList
          notes={notes}
          onToggleStar={handleToggleStar}
          onDelete={handleDeleteNote}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />

        {!isLoggedInMode && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            You are currently browsing as a guest. Your notes are saved locally in your browser. Log in to save them to your account!
          </p>
        )}
      </div>
    </div>
  );
}