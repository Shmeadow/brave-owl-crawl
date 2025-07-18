"use client";

import React from "react";
import { JournalEntryItem } from "@/components/journal-entry-item";
import { JournalEntryData } from "@/hooks/use-journal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JournalEntryListProps {
  entries: JournalEntryData[];
  onDelete: (entryId: string) => void;
  isCurrentRoomWritable: boolean;
  onUpdateEntryContent: (entryId: string, newContent: string) => void;
  onUpdateEntryTitle: (entryId: string, newTitle: string) => void;
  activeReminderEntryId: string | null; // New prop
  onEntryOpenChange: (entryId: string, isOpen: boolean) => void; // New prop
}

export function JournalEntryList({
  entries,
  onDelete,
  isCurrentRoomWritable,
  onUpdateEntryContent,
  onUpdateEntryTitle,
  activeReminderEntryId, // Destructure new prop
  onEntryOpenChange, // Destructure new prop
}: JournalEntryListProps) {
  return (
    <>
      {entries.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No journal entries added yet. Start by adding one above!</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 space-y-4">
            {entries.map((entry) => (
              <JournalEntryItem
                key={entry.id}
                entry={entry}
                onDelete={onDelete}
                isCurrentRoomWritable={isCurrentRoomWritable}
                onUpdateEntryContent={onUpdateEntryContent}
                onUpdateEntryTitle={onUpdateEntryTitle}
                isInitiallyOpen={entry.id === activeReminderEntryId} // Pass initial open state
                onOpenChange={(isOpen) => onEntryOpenChange(entry.id, isOpen)} // Pass open change handler
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}