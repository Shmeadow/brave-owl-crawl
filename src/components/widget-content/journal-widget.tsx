"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddJournalEntryForm } from "@/components/add-journal-entry-form";
import { JournalEntryList } from "@/components/journal-entry-list";
import { useJournal, ImportantReminder } from "@/hooks/use-journal";
import { Loader2, Star, Upload, Download, Copy } from "lucide-react"; // Import Upload, Download, Copy
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover
import { ImportJournalContent } from "@/components/journal/ImportJournalContent"; // Import new components
import { ExportJournalContent } from "@/components/journal/ExportJournalContent";
import { CopyJournalContent } from "@/components/journal/CopyJournalContent";
import { Button } from "@/components/ui/button"; // Import Button

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
    handleBulkImportJournalEntries, // New import function
    generateJournalExportText, // New export function
  } = useJournal();

  const [activeReminderEntryId, setActiveReminderEntryId] = useState<string | null>(null);
  const [isImportPopoverOpen, setIsImportPopoverOpen] = useState(false);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
  const [isCopyPopoverOpen, setIsCopyPopoverOpen] = useState(false);

  // State for import/export/copy options
  const [colSep, setColSep] = useState(',');
  const [rowSep, setRowSep] = useState('\\n');
  const [customColSep, setCustomColSep] = useState('');
  const [customRowSep, setCustomRowSep] = useState('');

  const handleReminderClick = (reminder: ImportantReminder) => {
    setActiveReminderEntryId(reminder.entryId);
    // Switch to entries tab if not already there
    const tabsList = document.querySelector('[role="tablist"]');
    if (tabsList) {
      const entriesTab = tabsList.querySelector('[data-state="inactive"][value="entries"]');
      if (entriesTab instanceof HTMLElement) {
        entriesTab.click();
      }
    }
  };

  const handleEntryOpenChange = (entryId: string, isOpen: boolean) => {
    if (!isOpen && activeReminderEntryId === entryId) {
      setActiveReminderEntryId(null); // Clear active reminder if entry is closed
    }
  };

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
                  activeReminderEntryId={activeReminderEntryId}
                  onEntryOpenChange={handleEntryOpenChange}
                />
              </TabsContent>

              <TabsContent value="reminders" className="mt-0">
                <ScrollArea className="h-[400px] pr-4">
                  {importantReminders.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No important reminders yet. Mark text with the ⭐ button in your journal entries!</p>
                  ) : (
                    <ul className="space-y-4">
                      {importantReminders.map((reminder, index) => (
                        <li key={`${reminder.entryId}-${index}`} className="text-sm border-b border-border/50 pb-3 last:border-b-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => handleReminderClick(reminder)}>
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

        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader><CardTitle>Data Management</CardTitle></CardHeader>
          <CardContent className="p-4 flex flex-col gap-3">
            <Popover open={isImportPopoverOpen} onOpenChange={setIsImportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" /> Import
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 z-[1100] p-0 max-w-[calc(100vw-2rem)]" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                <ImportJournalContent
                  onBulkImport={handleBulkImportJournalEntries}
                  onClosePopover={() => setIsImportPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>

            <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Export File
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 z-[1100] p-0 max-w-[calc(100vw-2rem)]" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                <ExportJournalContent
                  entries={journalEntries}
                  colSep={colSep} setColSep={setColSep} customColSep={customColSep} setCustomColSep={setCustomColSep}
                  rowSep={rowSep} setRowSep={setRowSep} customRowSep={customRowSep} setCustomRowSep={setCustomRowSep}
                  onClosePopover={() => setIsExportPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>

            <Popover open={isCopyPopoverOpen} onOpenChange={setIsCopyPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" /> Copy Text
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 z-[1100] p-0 max-w-[calc(100vw-2rem)]" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                <CopyJournalContent
                  entries={journalEntries}
                  colSep={colSep} setColSep={setColSep} customColSep={customColSep} setCustomColSep={setCustomColSep}
                  rowSep={rowSep} setRowSep={setRowSep} customRowSep={customRowSep} setCustomRowSep={setCustomRowSep}
                  onClosePopover={() => setIsCopyPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}