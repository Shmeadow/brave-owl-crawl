"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Category } from '@/hooks/flashcards/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ImportFlashcardsContentProps {
  onBulkImport: (newCards: { front: string; back: string }[], categoryId: string | null) => Promise<number>;
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category | null>;
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

export function ImportFlashcardsContent({ onBulkImport, categories, onAddCategory, onClosePopover }: ImportFlashcardsContentProps) {
  const [textValue, setTextValue] = useState('');
  const [importTarget, setImportTarget] = useState<string>('new'); // Default to 'new' or first category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [colSep, setColSep] = useState(',');
  const [customColSep, setCustomColSep] = useState('');

  const getColumnSeparatorValue = () => {
    if (colSep === 'custom') return customColSep;
    return colSep;
  };

  const parseCSV = (csvText: string, columnSeparator: string): { front: string; back: string }[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    // Determine if there's a header row
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('front') && firstLine.includes('back')) {
      startIndex = 1; // Skip header
    }

    const parsedCards: { front: string; back: string }[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines

      const values = parseCsvLine(line, columnSeparator);
      const front = values[0]?.trim() || '';
      const back = values[1]?.trim() || '';

      if (front && back) { // Only add if both front and back are non-empty
        parsedCards.push({ front, back });
      }
    }
    return parsedCards;
  };

  const handleImport = async (content: string) => {
    let categoryId: string | null = null;
    if (importTarget === 'new') {
      if (!newCategoryName.trim()) {
        toast.error("Please enter a name for the new category.");
        return;
      }
      const newCategory = await onAddCategory(newCategoryName.trim());
      if (newCategory) {
        categoryId = newCategory.id;
      } else {
        return;
      }
    } else { // If a specific category is selected
      categoryId = importTarget;
    }

    try {
      const actualColSep = getColumnSeparatorValue();
      const parsedCards = parseCSV(content, actualColSep);
      if (parsedCards.length === 0) {
        toast.error("No valid cards found in the provided text. Ensure correct format and separators.");
        return;
      }
      const importedCount = await onBulkImport(parsedCards, categoryId);
      toast.success(`Successfully imported ${importedCount} new cards!`);
      setTextValue('');
      setNewCategoryName('');
      onClosePopover(); // Close popover after successful import
    } catch (error) {
      toast.error("Failed to parse or import cards. Please check the format and separators.");
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
      <h4 className="font-medium leading-none mb-2">Import Flashcards</h4>
      <div>
        <Label>Import Into</Label>
        <Select value={importTarget} onValueChange={setImportTarget}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New Category...</SelectItem>
            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {importTarget === 'new' && (
          <Input
            id="new-category-name-import" // Added ID here
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="mt-2"
          />
        )}
      </div>
      <div className="space-y-2">
        <Label>Column Separator</Label>
        <RadioGroup value={colSep} onValueChange={setColSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="," id="col-comma-import" /><Label htmlFor="col-comma-import">Comma (,)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="col-semi-import" /><Label htmlFor="col-semi-import">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="col-custom-import" /><Label htmlFor="col-custom-import">Custom</Label></div>
        </RadioGroup>
        {colSep === 'custom' && <Input id="custom-col-sep-import" placeholder="Custom separator" value={customColSep} onChange={(e) => setCustomColSep(e.target.value)} />}
      </div>
      <div>
        <Label htmlFor="paste-csv">Paste CSV Data</Label>
        <p className="text-xs text-muted-foreground mb-1">Format: "front text","back text"</p>
        <Textarea id="paste-csv" placeholder='"What is the capital of France?","Paris"' value={textValue} onChange={(e) => setTextValue(e.target.value)} rows={4} />
        <Button onClick={() => handleImport(textValue)} className="mt-2 w-full" disabled={!textValue}>Import from Text</Button>
      </div>
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border" /><span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span><div className="flex-grow border-t border-border" />
      </div>
      <div>
        <Label htmlFor="import-file">Import from File</Label>
        <p className="text-xs text-muted-foreground mb-1">Select a .csv file.</p>
        <Input id="import-file" type="file" accept=".csv" onChange={handleFileChange} />
      </div>
    </div>
  );
}