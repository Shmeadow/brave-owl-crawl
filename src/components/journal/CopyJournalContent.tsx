"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { JournalEntryData } from '@/hooks/use-journal';

interface CopyJournalContentProps {
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

export function CopyJournalContent({
  entries,
  colSep, setColSep, customColSep, setCustomColSep,
  rowSep, setRowSep, customRowSep, setCustomRowSep,
  onClosePopover,
}: CopyJournalContentProps) {
  const [generatedText, setGeneratedText] = useState('');

  const getSeparatorValue = (sep: string, customSep: string) => {
    if (sep === 'custom') return customSep;
    if (sep === '\\n') return '\n';
    return sep;
  };

  useEffect(() => {
    const actualColSep = getSeparatorValue(colSep, customColSep);
    const actualRowSep = getSeparatorValue(rowSep, customRowSep);
    const header = `"title"${actualColSep}"content"`;
    const rows = entries.map(entry => {
      const title = `"${(entry.title || '').replace(/"/g, '""')}"`;
      let contentText = entry.content;
      // For copy, convert HTML content to plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentText;
      contentText = tempDiv.textContent || '';
      
      const content = `"${contentText.replace(/"/g, '""')}"`;
      return `${title}${actualColSep}${content}`;
    });
    setGeneratedText(header + actualRowSep + rows.join(actualRowSep));
  }, [entries, colSep, rowSep, customColSep, customRowSep]);

  const handleCopy = () => {
    if (entries.length === 0) {
      toast.error("No entries to copy.");
      return;
    }
    navigator.clipboard.writeText(generatedText).then(() => {
      toast.success("Copied to clipboard!");
      onClosePopover();
    }, () => {
      toast.error("Failed to copy to clipboard.");
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h4 className="font-medium leading-none mb-2">Copy Journal Entries to Clipboard</h4>
      <div className="space-y-2">
        <Label>Column Separator</Label>
        <RadioGroup value={colSep} onValueChange={setColSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="," id="col-comma-copy-journal" /><Label htmlFor="col-comma-copy-journal">Comma (,)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="col-semi-copy-journal" /><Label htmlFor="col-semi-copy-journal">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="col-custom-copy-journal" /><Label htmlFor="col-custom-copy-journal">Custom</Label></div>
        </RadioGroup>
        {colSep === 'custom' && <Input placeholder="Custom separator" value={customColSep} onChange={(e) => setCustomColSep(e.target.value)} />}
      </div>
      <div className="space-y-2">
        <Label>Row Separator</Label>
        <RadioGroup value={rowSep} onValueChange={setRowSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="\n" id="row-newline-copy-journal" /><Label htmlFor="row-newline-copy-journal">New Line</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="row-semi-copy-journal" /><Label htmlFor="row-semi-copy-journal">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="row-custom-copy-journal" /><Label htmlFor="col-custom-copy-journal">Custom</Label></div>
        </RadioGroup>
        {rowSep === 'custom' && <Input placeholder="Custom separator" value={customRowSep} onChange={(e) => setCustomRowSep(e.target.value)} />}
      </div>
      <Textarea value={generatedText} readOnly rows={5} className="text-xs font-mono" />
      <Button onClick={handleCopy} className="w-full">Copy to Clipboard</Button>
    </div>
  );
}