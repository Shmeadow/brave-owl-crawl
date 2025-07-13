"use client";

import React from "react";
import { JournalEntryItem } from "@/components/journal-entry-item";
import { JournalEntryData } from "@/hooks/use-journal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JournalEntryListProps {
  entries: JournalEntryData[];
  onToggleStar: (entryId: string) => void;
  onDelete: (entryId: string) => void;
  isCurrentRoomWritable: boolean;
  onUpdateEntryContent: (entryId: string, newContent: string) => void;
  onUpdateEntryTitle: (entryId: string, newTitle: string) => void;
  onSelectEntryForAnnotations: (entryId: string | null) => void;
  activeEntryForAnnotations: string | null;
}

export function JournalEntryList({
  entries,
  onToggleStar,
  onDelete,
  isCurrentRoomWritable,
  onUpdateEntryContent,
  onUpdateEntryTitle,
  onSelectEntryForAnnotations,
  activeEntryForAnnotations,
}: JournalEntryListProps) {
  return (
    <>
      {entries.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No journal entries added yet. Start by adding one above!</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-2 space-y-3">
            {entries.map((entry) => (
              <JournalEntryItem
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