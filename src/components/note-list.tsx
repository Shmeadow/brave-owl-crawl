"use client";

import React from "react";
import { NoteItem } from "@/components/note-item";
import { NoteData } from "@/hooks/use-notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NoteListProps {
  notes: NoteData[];
  onToggleStar: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

export function NoteList({ notes, onToggleStar, onDelete }: NoteListProps) {
  return (
    <Card className="w-full flex flex-col flex-1 bg-card backdrop-blur-xl border-white/20"> {/* Removed /40 */}
      <CardHeader>
        <CardTitle>Your Notes</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {notes.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm text-center">No notes added yet. Start by adding one above!</p>
        ) : (
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-3">
              {notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onToggleStar={onToggleStar}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}