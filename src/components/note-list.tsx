"use client";

import React from "react";
import { NoteItem } from "@/components/note-item"; // Updated import
import { NoteData } from "@/hooks/use-notes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NoteListProps {
  notes: NoteData[];
  onToggleStar: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  isCurrentRoomWritable: boolean;
  onUpdateNoteContent: (noteId: string, newContent: string) => void;
  onUpdateNoteTitle: (noteId: string, newTitle: string) => void;
}

export function NoteList({
  notes,
  onToggleStar,
  onDelete,
  isCurrentRoomWritable,
  onUpdateNoteContent,
  onUpdateNoteTitle,
}: NoteListProps) {
  return (
    <>
      {notes.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No notes added yet. Start by adding one above!</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-2 space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onToggleStar={onToggleStar}
                onDelete={onDelete}
                isCurrentRoomWritable={isCurrentRoomWritable}
                onUpdateNoteContent={onUpdateNoteContent}
                onUpdateNoteTitle={onUpdateNoteTitle}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}