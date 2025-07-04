"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CardData } from '@/hooks/use-flashcards';

interface ImportExportProps {
  cards: CardData[];
  onBulkImport: (newCards: { front: string; back: string }[]) => Promise<number>;
  isCurrentRoomWritable: boolean;
}

export function ImportExport({ cards, onBulkImport, isCurrentRoomWritable }: ImportExportProps) {
  const [textValue, setTextValue] = useState('');

  const handleExport = (format: 'csv' | 'json') => {
    if (cards.length === 0) {
      toast.error("No cards to export.");
      return;
    }

    let dataStr: string;
    let fileExt: string;
    let mimeType: string;

    if (format === 'json') {
      dataStr = JSON.stringify(cards.map(({ front, back }) => ({ front, back })), null, 2);
      fileExt = 'json';
      mimeType = 'application/json';
    } else { // csv
      const header = '"front","back"\n';
      const rows = cards.map(c => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}"`).join('\n');
      dataStr = header + rows;
      fileExt = 'csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flashcards.${fileExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${cards.length} cards as ${format.toUpperCase()}.`);
  };

  const parseCSV = (csvText: string): { front: string; back: string }[] => {
    const lines = csvText.trim().split('\n');
    // Skip header if present
    if (lines[0].toLowerCase().includes('front') && lines[0].toLowerCase().includes('back')) {
      lines.shift();
    }
    return lines.map(line => {
      const values = line.split(',');
      // Basic CSV parsing, assumes no commas in fields for now
      const front = values[0]?.trim().replace(/^"|"$/g, '') || '';
      const back = values[1]?.trim().replace(/^"|"$/g, '') || '';
      return { front, back };
    }).filter(c => c.front && c.back);
  };

  const handleImport = async (content: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to import cards in this room.");
      return;
    }
    try {
      const parsedCards = parseCSV(content);
      if (parsedCards.length === 0) {
        toast.error("No valid cards found in the provided text.");
        return;
      }
      const importedCount = await onBulkImport(parsedCards);
      toast.success(`Successfully imported ${importedCount} new cards!`);
      setTextValue('');
    } catch (error) {
      toast.error("Failed to parse or import cards. Please check the format.");
      console.error(error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleImport(content);
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 mt-6">
      <CardHeader>
        <CardTitle>Import / Export</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          <TabsContent value="import" className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Paste CSV Data</label>
              <p className="text-xs text-muted-foreground mb-2">Format: "front text","back text"</p>
              <Textarea
                placeholder='"What is the capital of France?","Paris"'
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                rows={5}
                disabled={!isCurrentRoomWritable}
              />
              <Button onClick={() => handleImport(textValue)} className="mt-2 w-full" disabled={!textValue || !isCurrentRoomWritable}>
                Import from Text
              </Button>
            </div>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <div>
              <label className="text-sm font-medium">Import from File</label>
              <p className="text-xs text-muted-foreground mb-2">Select a .csv file.</p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={!isCurrentRoomWritable}
              />
            </div>
            <p className="text-xs text-muted-foreground pt-2">Note: Import from URL is not yet supported. Please paste text or upload a file.</p>
          </TabsContent>
          <TabsContent value="export" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Export your current flashcard deck to a file.</p>
            <div className="flex gap-4">
              <Button onClick={() => handleExport('csv')} className="flex-1">Export as CSV</Button>
              <Button onClick={() => handleExport('json')} className="flex-1">Export as JSON</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}