"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CardData } from '@/hooks/flashcards/types';

interface ExportFlashcardsContentProps {
  cards: CardData[];
  colSep: string;
  setColSep: (value: string) => void;
  customColSep: string;
  setCustomColSep: (value: string) => void;
  rowSep: string;
  setRowSep: (value: string) => void;
  customRowSep: string;
  setCustomRowSep: (value: string) => void;
  onClosePopover: () => void;
}

export function ExportFlashcardsContent({
  cards,
  colSep, setColSep, customColSep, setCustomColSep,
  rowSep, setRowSep, customRowSep, setCustomRowSep,
  onClosePopover,
}: ExportFlashcardsContentProps) {

  const getSeparatorValue = (sep: string, customSep: string) => {
    if (sep === 'custom') return customSep;
    if (sep === '\\n') return '\n';
    return sep;
  };

  const generateCsvText = () => {
    const actualColSep = getSeparatorValue(colSep, customColSep);
    const actualRowSep = getSeparatorValue(rowSep, customRowSep);
    const header = `"front"${actualColSep}"back"`;
    const rows = cards.map(c => `"${c.front.replace(/"/g, '""')}"${actualColSep}"${c.back.replace(/"/g, '""')}"`);
    return header + actualRowSep + rows.join(actualRowSep);
  };

  const handleExport = () => {
    if (cards.length === 0) {
      toast.error("No cards to export.");
      return;
    }
    const generatedText = generateCsvText();
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
    onClosePopover();
  };

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none mb-2">Export Flashcards to File</h4>
      <div className="space-y-2">
        <Label>Column Separator</Label>
        <RadioGroup value={colSep} onValueChange={setColSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="," id="col-comma-export" /><Label htmlFor="col-comma-export">Comma (,)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="col-semi-export" /><Label htmlFor="col-semi-export">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="col-custom-export" /><Label htmlFor="col-custom-export">Custom</Label></div>
        </RadioGroup>
        {colSep === 'custom' && <Input placeholder="Custom separator" value={customColSep} onChange={(e) => setCustomColSep(e.target.value)} />}
      </div>
      <div className="space-y-2">
        <Label>Row Separator</Label>
        <RadioGroup value={rowSep} onValueChange={setRowSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="\n" id="row-newline-export" /><Label htmlFor="row-newline-export">New Line</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="row-semi-export" /><Label htmlFor="row-semi-export">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="row-custom-export" /><Label htmlFor="row-custom-export">Custom</Label></div>
        </RadioGroup>
        {rowSep === 'custom' && <Input placeholder="Custom separator" value={customRowSep} onChange={(e) => setCustomRowSep(e.target.value)} />}
      </div>
      <Button onClick={handleExport} className="w-full">Download CSV</Button>
    </div>
  );
}