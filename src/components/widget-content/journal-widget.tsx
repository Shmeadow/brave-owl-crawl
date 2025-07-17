"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddJournalEntryForm } from "@/components/add-journal-entry-form";
import { JournalEntryList } from "@/components/journal-entry-list";
import { useJournal } from "@/hooks/use-journal"; // Removed ImportantReminder import
import { Loader2, Upload, Download, Copy } from "lucide-react"; // Removed Star import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImportJournalContent } from "@/components/journal/ImportJournalContent";
import { ExportJournalContent } from "@/components/journal/ExportJournalContent";
import { CopyJournalContent } from "@/components/journal/CopyJournalContent";
import { Button } from "@/components/ui/button";
import { JournalDashboard } from "@/components/journal/JournalDashboard";

interface JournalWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function JournalWidget({ isCurrentRoomWritable }: JournalWidgetProps) {
  const {
    journalEntries,
    importantReminders, // Keep for now, but will be empty
    loading,
    isLoggedInMode,
    handleAddJournalEntry,
    handleDeleteJournalEntry,
    handleToggleStarJournalEntry,
    handleUpdateJournalEntryContent,
    handleUpdateJournalEntryTitle,
    handleBulkImportJournalEntries,
  } = useJournal();

  const [activeReminderEntryId, setActiveReminderEntryId] = useState<string | null>(null);
  const [isImportPopoverOpen, setIsImportPopoverOpen] = useState(false);
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
  const [isCopyPopoverOpen, setIsCopyPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for import/export/copy options
  const [colSep, setColSep] = useState(',');
  const [rowSep, setRowSep] = useState('\\n');
  const [customColSep, setCustomColSep] = useState('');
  const [customRowSep, setCustomRowSep] = useState('');

  // Removed handleReminderClick and handleEntryOpenChange as the reminder feature is simplified.

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
        <Card className="w-full flex-1 bg-card backdrop-blur-xl border-white/20">
          <CardHeader className="pb-2">
            <CardTitle>Journal Content</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="entries">Entries ({journalEntries.length})</TabsTrigger>
                <TabsTrigger value="reminders">Reminders ({importantReminders.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="mt-0">
                <JournalDashboard
                  isCurrentRoomWritable={isCurrentRoomWritable}
                  onViewAllEntries={() => setActiveTab('entries')}
                  // Removed onReminderClick prop
                />
              </TabsContent>

              <TabsContent value="entries" className="mt-0">
                <AddJournalEntryForm
                  onAddEntry={(entry) => {
                    handleAddJournalEntry(entry);
                  }}
                  isCurrentRoomWritable={isCurrentRoomWritable}
                />
                <JournalEntryList
                  entries={journalEntries}
                  onToggleStar={handleToggleStarJournalEntry}
                  onDelete={handleDeleteJournalEntry}
                  isCurrentRoomWritable={isCurrentRoomWritable}
                  onUpdateEntryContent={handleUpdateJournalEntryContent}
                  onUpdateEntryTitle={handleUpdateJournalEntryTitle}
                  // Removed activeReminderEntryId and onEntryOpenChange
                />
              </TabsContent>

              <TabsContent value="reminders" className="mt-0">
                <ScrollArea className="h-[400px] pr-4">
                  {importantReminders.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No important reminders yet. Type "Important:" in your journal entries to create one!</p>
                  ) : (
                    <ul className="space-y-4">
                      {importantReminders.map((reminder, index) => (
                        <li key={`${reminder.entryId}-${index}`} className="text-sm border-b border-border/50 pb-3 last:border-b-0 p-2 rounded-md">
                          <p className="font-semibold text-foreground">
                            From: "{reminder.entryTitle || 'Untitled Entry'}"
                          </p>
                          <p className="text-muted-foreground ml-0">"{reminder.text}"</p>
                          <p className="text-xs text-muted-foreground mt-1">
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