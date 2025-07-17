"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { JournalEntryData } from '@/hooks/use-journal';

interface ExportJournalContentProps {
  entries: JournalEntryData[];
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

export function ExportJournalContent({
  entries,
  colSep, setColSep, customColSep, setCustomColSep,
  rowSep, setRowSep, customRowSep, setCustomRowSep,
  onClosePopover,
}: ExportJournalContentProps) {

  const getSeparatorValue = (sep: string, customSep: string) => {
    if (sep === 'custom') return customSep;
    if (sep === '\\n') return '\n';
    return sep;
  };

  const generateCsvText = () => {
    const actualColSep = getSeparatorValue(colSep, customColSep);
    const actualRowSep = getSeparatorValue(rowSep, customRowSep);
    const header = `"title"${actualColSep}"content"`;
    const rows = entries.map(entry => {
      const title = `"${(entry.title || '').replace(/"/g, '""')}"`;
      let contentText = entry.content;
      // For CSV export, convert HTML content to plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentText;
      contentText = tempDiv.textContent || '';
      
      const content = `"${contentText.replace(/"/g, '""')}"`;
      return `${title}${actualColSep}${content}`;
    });
    return header + actualRowSep + rows.join(actualRowSep);
  };

  const handleExport = () => {
    if (entries.length === 0) {
      toast.error("No entries to export.");
      return;
    }
    const generatedText = generateCsvText();
    const blob = new Blob([generatedText], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'journal_entries.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${entries.length} entries.`);
    onClosePopover();
  };

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none mb-2">Export Journal Entries to File</h4>
      <div className="space-y-2">
        <Label>Column Separator</Label>
        <RadioGroup value={colSep} onValueChange={setColSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="," id="col-comma-export-journal" /><Label htmlFor="col-comma-export-journal">Comma (,)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="col-semi-export-journal" /><Label htmlFor="col-semi-export-journal">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="col-custom-export-journal" /><Label htmlFor="col-custom-export-journal">Custom</Label></div>
        </RadioGroup>
        {colSep === 'custom' && <Input placeholder="Custom separator" value={customColSep} onChange={(e) => setCustomColSep(e.target.value)} />}
      </div>
      <div className="space-y-2">
        <Label>Row Separator</Label>
        <RadioGroup value={rowSep} onValueChange={setRowSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="\n" id="row-newline-export-journal" /><Label htmlFor="row-newline-export-journal">New Line</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="row-semi-export-journal" /><Label htmlFor="row-semi-export-journal">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="row-custom-export-journal" /><Label htmlFor="col-custom-export-journal">Custom</Label></div>
        </RadioGroup>
        {rowSep === 'custom' && <Input placeholder="Custom separator" value={customRowSep} onChange={(e) => setCustomRowSep(e.target.value)} />}
      </div>
      <Button onClick={handleExport} className="w-full">Download CSV</Button>
    </div>
  );
}