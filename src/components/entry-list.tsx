"use client";

import React from "react";
import { EntryItem } from "@/components/entry-item"; // Updated import
import { NoteData } from "@/hooks/use-notes"; // Still using NoteData as the base type
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Keep Card imports if needed for other components, but not for this one's direct return.

interface EntryListProps {
  entries: NoteData[]; // Renamed from 'notes' to 'entries'
  onToggleStar: (entryId: string) => void; // Renamed from 'noteId'
  onDelete: (entryId: string) => void; // Renamed from 'noteId'
  isCurrentRoomWritable: boolean;
  onUpdateEntryContent: (entryId: string, newContent: string) => void; // Renamed from 'noteId'
  onUpdateEntryTitle: (entryId: string, newTitle: string) => void; // Renamed from 'noteId'
  onSelectEntryForAnnotations: (entryId: string | null) => void; // Renamed from 'noteId'
  activeEntryForAnnotations: string | null; // Renamed from 'noteId'
}

export function EntryList({
  entries,
  onToggleStar,
  onDelete,
  isCurrentRoomWritable,
  onUpdateEntryContent,
  onUpdateEntryTitle,
  onSelectEntryForAnnotations,
  activeEntryForAnnotations,
}: EntryListProps) {
  return (
    <> {/* Use a fragment as the outer div is removed */}
      {entries.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No entries added yet. Start by adding one above!</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-2 space-y-3"> {/* Adjusted padding from p-1 to p-2 */}
            {entries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                onToggleStar={onToggleStar}
                onDelete={onDelete}
                isCurrentRoomWritable={isCurrentRoomWritable}
                onUpdateEntryContent={onUpdateEntryContent}
                onUpdateEntryTitle={onUpdateEntryTitle}
                onSelectEntryForAnnotations={onSelectEntryForAnnotations}
                activeEntryForAnnotations={activeEntryForAnnotations}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}