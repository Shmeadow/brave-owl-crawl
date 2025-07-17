"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookText, Star, History, Loader2 } from 'lucide-react';
import { useJournal } from '@/hooks/use-journal'; // Removed ImportantReminder import
import { useSupabase } from '@/integrations/supabase/auth';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddJournalEntryForm } from '@/components/add-journal-entry-form';
import { cn } from '@/lib/utils';

interface JournalDashboardProps {
  isCurrentRoomWritable: boolean;
  onViewAllEntries: () => void;
  // Removed onReminderClick: (reminder: ImportantReminder) => void;
}

export function JournalDashboard({ isCurrentRoomWritable, onViewAllEntries }: JournalDashboardProps) {
  const { journalEntries, importantReminders, loading, isLoggedInMode, handleAddJournalEntry } = useJournal();
  const { session } = useSupabase();
  const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);

  const recentEntries = journalEntries.slice(0, 5); // Show up to 5 most recent entries

  const renderContentPreview = (content: string) => {
    // Create a temporary div to parse HTML and get text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainTextContent = tempDiv.textContent || '';
    return plainTextContent.substring(0, 100) + (plainTextContent.length > 100 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading journal dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-foreground text-center">Your Journal Dashboard</h1>

      {!isLoggedInMode && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardContent className="text-center text-sm text-muted-foreground p-2">
            You are currently browsing as a guest. Your journal entries are saved locally. Log in to save them to your account!
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Quick Add & View All */}
        <Card className="bg-card backdrop-blur-xl border-white/20 flex flex-col items-center justify-center p-6 text-center">
          <CardTitle className="mb-4">Start a New Entry</CardTitle>
          <Dialog open={isAddEntryDialogOpen} onOpenChange={setIsAddEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full max-w-[200px]">
                <PlusCircle className="mr-2 h-5 w-5" /> Quick Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 z-[1200]">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle>Add New Journal Entry</DialogTitle>
              </DialogHeader>
              <AddJournalEntryForm
                onAddEntry={(entry) => {
                  handleAddJournalEntry(entry);
                  setIsAddEntryDialogOpen(false);
                }}
                isCurrentRoomWritable={isCurrentRoomWritable}
              />
            </DialogContent>
          </Dialog>
          <Button variant="link" onClick={onViewAllEntries} className="mt-4">
            <BookText className="mr-2 h-4 w-4" /> View All Entries
          </Button>
        </Card>

        {/* Important Reminders */}
        <Card className="bg-card backdrop-blur-xl border-white/20 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" /> Important Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            <ScrollArea className="h-[200px] pr-4">
              <div>
                {importantReminders.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No important reminders yet. Type "Important:" in your journal entries!</p>
                ) : (
                  <ul className="space-y-3">
                    {importantReminders.slice(0, 5).map((reminder, index) => (
                      <li
                        key={`${reminder.entryId}-${index}`}
                        className="text-sm border-b border-border/50 pb-2 last:border-b-0 p-2 rounded-md"
                      >
                        <p className="font-semibold text-foreground flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-current mr-2 inline-block" />
                          From: "{reminder.entryTitle || 'Untitled Entry'}"
                        </p>
                        <p className="text-muted-foreground ml-6">"{reminder.text}"</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(reminder.timestamp), 'MMM d, yyyy')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card className="bg-card backdrop-blur-xl border-white/20 w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 pt-0">
          {recentEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No recent entries. Add your first entry!</p>
          ) : (
            <ScrollArea className="h-[250px] pr-4">
              <ul className="space-y-3">
                {recentEntries.map((entry) => (
                  <li key={entry.id} className="text-sm border-b border-border/50 pb-2 last:border-b-0">
                    <p className="font-semibold text-foreground truncate">{entry.title || 'Untitled Entry'}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {format(new Date(entry.created_at), 'MMM d, yyyy, hh:mm a')}
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: renderContentPreview(entry.content) }} />
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}