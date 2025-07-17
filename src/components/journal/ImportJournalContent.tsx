"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ImportJournalContentProps {
  onBulkImport: (newEntries: { title: string; content: string }[]) => Promise<number>;
  onClosePopover: () => void;
}

// Helper function to parse a CSV line, handling quoted fields
const parseCsvLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let inQuote = false;
  let currentField = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuote && nextChar === '"') { // Escaped quote
        currentField += '"';
        i++; // Skip next char
      } else {
        inQuote = !inQuote;
      }
    } else if (char === delimiter && !inQuote) {
      result.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField); // Push the last field
  return result;
};

export function ImportJournalContent({ onBulkImport, onClosePopover }: ImportJournalContentProps) {
  const [textValue, setTextValue] = useState('');
  const [colSep, setColSep] = useState(',');
  const [customColSep, setCustomColSep] = useState('');

  const getColumnSeparatorValue = () => {
    if (colSep === 'custom') return customColSep;
    return colSep;
  };

  const parseCSV = (csvText: string, columnSeparator: string): { title: string; content: string }[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    // Determine if there's a header row
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('title') && firstLine.includes('content')) {
      startIndex = 1; // Skip header
    }

    const parsedEntries: { title: string; content: string }[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines

      const values = parseCsvLine(line, columnSeparator);
      const title = values[0]?.trim() || `Imported Entry ${new Date().toLocaleString()}`;
      const content = values[1]?.trim() || '';

      if (content) { // Only add if content is non-empty
        parsedEntries.push({ title, content });
      }
    }
    return parsedEntries;
  };

  const handleImport = async (content: string) => {
    try {
      const actualColSep = getColumnSeparatorValue();
      const parsedEntries = parseCSV(content, actualColSep);
      if (parsedEntries.length === 0) {
        toast.error("No valid entries found in the provided text. Ensure correct format and separators.");
        return;
      }
      const importedCount = await onBulkImport(parsedEntries);
      toast.success(`Successfully imported ${importedCount} new entries!`);
      setTextValue('');
      onClosePopover(); // Close popover after successful import
    } catch (error) {
      toast.error("Failed to parse or import entries. Please check the format and separators.");
      console.error(error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => handleImport(e.target?.result as string);
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none mb-2">Import Journal Entries</h4>
      <div className="space-y-2">
        <Label>Column Separator</Label>
        <RadioGroup value={colSep} onValueChange={setColSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="," id="col-comma-import-journal" /><Label htmlFor="col-comma-import-journal">Comma (,)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="col-semi-import-journal" /><Label htmlFor="col-semi-import-journal">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="col-custom-import-journal" /><Label htmlFor="col-custom-import-journal">Custom</Label></div>
        </RadioGroup>
        {colSep === 'custom' && <Input placeholder="Custom separator" value={customColSep} onChange={(e) => setCustomColSep(e.target.value)} />}
      </div>
      <div>
        <Label htmlFor="paste-csv-journal">Paste CSV Data</Label>
        <p className="text-xs text-muted-foreground mb-1">Format: "title text","content text"</p>
        <Textarea id="paste-csv-journal" placeholder='"Daily Reflection","Today was a productive day..."' value={textValue} onChange={(e) => setTextValue(e.target.value)} rows={4} />
        <Button onClick={() => handleImport(textValue)} className="mt-2 w-full" disabled={!textValue}>Import from Text</Button>
      </div>
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border" /><span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span><div className="flex-grow border-t border-border" />
      </div>
      <div>
        <Label htmlFor="import-file-journal">Import from File</Label>
        <p className="text-xs text-muted-foreground mb-1">Select a .csv file.</p>
        <Input id="import-file-journal" type="file" accept=".csv" onChange={handleFileChange} />
      </div>
    </div>
  );
}