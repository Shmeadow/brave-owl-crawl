"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CardData, Category } from '@/hooks/flashcards/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ImportExportProps {
  cards: CardData[];
  onBulkImport: (newCards: { front: string; back: string }[], categoryId: string | null) => Promise<number>;
  categories: Category[];
  onAddCategory: (name: string) => Promise<Category | null>;
}

const SeparatorOptions = ({
  colSep, setColSep, customColSep, setCustomColSep,
  rowSep, setRowSep, customRowSep, setCustomRowSep
}: any) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Column Separator</Label>
      <RadioGroup value={colSep} onValueChange={setColSep}>
        <div className="flex items-center space-x-2"><RadioGroupItem value="," id="col-comma" /><Label htmlFor="col-comma">Comma (,)</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="col-semi" /><Label htmlFor="col-semi">Semicolon (;)</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="col-custom" /><Label htmlFor="col-custom">Custom</Label></div>
      </RadioGroup>
      {colSep === 'custom' && <Input placeholder="Custom separator" value={customColSep} onChange={(e) => setCustomColSep(e.target.value)} />}
    </div>
    <div className="space-y-2">
      <Label>Row Separator</Label>
      <RadioGroup value={rowSep} onValueChange={setRowSep}>
        <div className="flex items-center space-x-2"><RadioGroupItem value="\n" id="row-newline" /><Label htmlFor="row-newline">New Line</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="row-semi" /><Label htmlFor="row-semi">Semicolon (;)</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="row-custom" /><Label htmlFor="row-custom">Custom</Label></div>
      </RadioGroup>
      {rowSep === 'custom' && <Input placeholder="Custom separator" value={customRowSep} onChange={(e) => setCustomRowSep(e.target.value)} />}
    </div>
  </div>
);

export function ImportExport({ cards, onBulkImport, categories, onAddCategory }: ImportExportProps) {
  const [textValue, setTextValue] = useState('');
  const [importTarget, setImportTarget] = useState<string>('new'); // Default to 'new' or first category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [colSep, setColSep] = useState(',');
  const [rowSep, setRowSep] = useState('\\n');
  const [customColSep, setCustomColSep] = useState('');
  const [customRowSep, setCustomRowSep] = useState('');
  const [generatedText, setGeneratedText] = useState('');

  useEffect(() => {
    if (categories.length > 0 && importTarget === 'new') {
      setImportTarget(categories[0].id);
    } else if (categories.length === 0 && importTarget !== 'new') {
      setImportTarget('new');
    }
  }, [categories, importTarget]);

  const getSeparatorValue = (sep: string, customSep: string) => {
    if (sep === 'custom') return customSep;
    if (sep === '\\n') return '\n';
    return sep;
  };

  useEffect(() => {
    const actualColSep = getSeparatorValue(colSep, customColSep);
    const actualRowSep = getSeparatorValue(rowSep, customRowSep);
    const header = `"front"${actualColSep}"back"`;
    const rows = cards.map(c => `"${c.front.replace(/"/g, '""')}"${actualColSep}"${c.back.replace(/"/g, '""')}"`);
    setGeneratedText(header + actualRowSep + rows.join(actualRowSep));
  }, [cards, colSep, rowSep, customColSep, customRowSep]);

  const handleExport = () => {
    if (cards.length === 0) {
      toast.error("No cards to export.");
      return;
    }
    const blob = new Blob([generatedText], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flashcards.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${cards.length} cards.`);
  };

  const parseCSV = (csvText: string): { front: string; back: string }[] => {
    const lines = csvText.trim().split('\n');
    if (lines[0].toLowerCase().includes('front') && lines[0].toLowerCase().includes('back')) {
      lines.shift();
    }
    return lines.map(line => {
      const values = line.split(',');
      const front = values[0]?.trim().replace(/^"|"$/g, '') || '';
      const back = values[1]?.trim().replace(/^"|"$/g, '') || '';
      return { front, back };
    }).filter(c => c.front && c.back);
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
    } else { 
      categoryId = importTarget;
    }

    try {
      const parsedCards = parseCSV(content);
      if (parsedCards.length === 0) {
        toast.error("No valid cards found in the provided text.");
        return;
      }
      const importedCount = await onBulkImport(parsedCards, categoryId);
      toast.success(`Successfully imported ${importedCount} new cards!`);
      setTextValue('');
      setNewCategoryName('');
    } catch (error) {
      toast.error("Failed to parse or import cards. Please check the format.");
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

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText).then(() => {
      toast.success("Copied to clipboard!");
    }, () => {
      toast.error("Failed to copy to clipboard.");
    });
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="import">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export File</TabsTrigger>
          <TabsTrigger value="copy">Copy Text</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-4 space-y-4">
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
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
          <div>
            <Label htmlFor="paste-csv">Paste CSV Data</Label>
            <p className="text-xs text-muted-foreground mb-2">Format: "front text","back text"</p>
            <Textarea id="paste-csv" placeholder='"What is the capital of France?","Paris"' value={textValue} onChange={(e) => setTextValue(e.target.value)} rows={4} />
            <Button onClick={() => handleImport(textValue)} className="mt-2 w-full" disabled={!textValue}>Import from Text</Button>
          </div>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border" /><span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span><div className="flex-grow border-t border-border" />
          </div>
          <div>
            <Label htmlFor="import-file">Import from File</Label>
            <p className="text-xs text-muted-foreground mb-2">Select a .csv file.</p>
            <Input id="import-file" type="file" accept=".csv" onChange={handleFileChange} />
          </div>
        </TabsContent>
        <TabsContent value="export" className="mt-4 space-y-4">
          <SeparatorOptions colSep={colSep} setColSep={setColSep} customColSep={customColSep} setCustomColSep={setCustomColSep} rowSep={rowSep} setRowSep={setRowSep} customRowSep={customRowSep} setCustomRowSep={setCustomRowSep} />
          <Button onClick={handleExport} className="w-full">Download CSV</Button>
        </TabsContent>
        <TabsContent value="copy" className="mt-4 space-y-4">
          <SeparatorOptions colSep={colSep} setColSep={setColSep} customColSep={customColSep} setCustomColSep={setCustomColSep} rowSep={rowSep} setRowSep={setRowSep} customRowSep={customRowSep} setCustomRowSep={setCustomRowSep} />
          <Textarea value={generatedText} readOnly rows={5} />
          <Button onClick={handleCopy} className="w-full">Copy to Clipboard</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}