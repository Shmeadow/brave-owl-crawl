"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddJournalEntryForm } from "@/components/add-journal-entry-form";
import { JournalEntryList } from "@/components/journal-entry-list";
import { useJournal, ImportantReminder } from "@/hooks/use-journal";
import { Loader2, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JournalWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function JournalWidget({ isCurrentRoomWritable }: JournalWidgetProps) {
  const {
    journalEntries,
    importantReminders,
    loading,
    isLoggedInMode,
    handleAddJournalEntry,
    handleDeleteJournalEntry,
    handleToggleStarJournalEntry,
    handleUpdateJournalEntryContent,
    handleUpdateJournalEntryTitle,
  } = useJournal();

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading journal entries...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center gap-6 p-2 sm:p-4">
      <h1 className="text-3xl font-bold text-foreground text-center">Your Journal</h1>

      {!isLoggedInMode && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardContent className="text-center text-sm text-muted-foreground p-2">
            You are currently browsing as a guest. Your journal entries are saved locally. Log in to save them to your account!
          </CardContent>
        </Card>
      )}

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        <AddJournalEntryForm
          onAddEntry={handleAddJournalEntry}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />

        <Card className="w-full flex-1 bg-card backdrop-blur-xl border-white/20">
          <CardHeader className="pb-2">
            <CardTitle>Journal Content</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Tabs defaultValue="entries" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="entries">Entries ({journalEntries.length})</TabsTrigger>
                <TabsTrigger value="reminders">Reminders ({importantReminders.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="entries" className="mt-0">
                <JournalEntryList
                  entries={journalEntries}
                  onToggleStar={handleToggleStarJournalEntry}
                  onDelete={handleDeleteJournalEntry}
                  isCurrentRoomWritable={isCurrentRoomWritable}
                  onUpdateEntryContent={handleUpdateJournalEntryContent}
                  onUpdateEntryTitle={handleUpdateJournalEntryTitle}
                />
              </TabsContent>

              <TabsContent value="reminders" className="mt-0">
                <ScrollArea className="h-[400px] pr-4">
                  {importantReminders.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No important reminders yet. Mark text with the ⭐ button in your journal entries!</p>
                  ) : (
                    <ul className="space-y-4">
                      {importantReminders.map((reminder, index) => (
                        <li key={index} className="text-sm border-b border-border/50 pb-3 last:border-b-0">
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            From: "{reminder.entryTitle || 'Untitled Entry'}"
                          </p>
                          <p className="text-muted-foreground ml-6">"{reminder.text}"</p>
                          <p className="text-xs text-muted-foreground ml-6 mt-1">
                            {new Date(reminder.timestamp).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}