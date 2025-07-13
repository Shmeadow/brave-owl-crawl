"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddNoteForm } from "@/components/add-note-form"; // Updated import
import { NoteList } from "@/components/note-list"; // Updated import
import { useNotes, NoteData } from "@/hooks/use-notes";
import { Loader2 } from "lucide-react";

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
        {/* Left Column: Add New Note Form */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <AddNoteForm
            onAddNote={handleAddNote}
            isCurrentRoomWritable={isCurrentRoomWritable}
          />
        </div>

        {/* Right Column: Note List */}
        <div className={`md:col-span-1 flex flex-col gap-6`}>
          <Card className="w-full flex-1 bg-card backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle>Your Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <NoteList
                notes={notes}
                onToggleStar={handleToggleStar}
                onDelete={handleDeleteNote}
                isCurrentRoomWritable={isCurrentRoomWritable}
                onUpdateNoteContent={handleUpdateNoteContent}
                onUpdateNoteTitle={handleUpdateNoteTitle}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}