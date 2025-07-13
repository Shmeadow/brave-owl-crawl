"use client";

import React from "react";
import { NoteItem } from "@/components/note-item";
import { NoteData } from "@/hooks/use-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Keep Card imports if needed for other components, but not for this one's direct return.

interface NoteListProps {
  notes: NoteData[];
  onToggleStar: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  isCurrentRoomWritable: boolean;
  onUpdateNoteContent: (noteId: string, newContent: string) => void; // New prop
  onUpdateNoteTitle: (noteId: string, newTitle: string) => void; // New prop
  onSelectNoteForAnnotations: (noteId: string | null) => void; // New prop
  activeNoteForAnnotations: string | null; // New prop
}

export function NoteList({
  notes,
  onToggleStar,
  onDelete,
  isCurrentRoomWritable,
  onUpdateNoteContent,
  onUpdateNoteTitle,
  onSelectNoteForAnnotations,
  activeNoteForAnnotations,
}: NoteListProps) {
  return (
    <> {/* Use a fragment as the outer div is removed */}
      {notes.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No notes added yet. Start by adding one above!</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-2 space-y-3"> {/* Adjusted padding from p-1 to p-2 */}
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onToggleStar={onToggleStar}
                onDelete={onDelete}
                isCurrentRoomWritable={isCurrentRoomWritable}
                onUpdateNoteContent={onUpdateNoteContent}
                onUpdateNoteTitle={onUpdateNoteTitle}
                onSelectNoteForAnnotations={onSelectNoteForAnnotations}
                activeNoteForAnnotations={activeNoteForAnnotations}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}