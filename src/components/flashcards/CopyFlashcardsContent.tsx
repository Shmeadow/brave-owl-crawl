"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CardData } from '@/hooks/flashcards/types';

interface CopyFlashcardsContentProps {
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

export function CopyFlashcardsContent({
  cards,
  colSep, setColSep, customColSep, setCustomColSep,
  rowSep, setRowSep, customRowSep, setCustomRowSep,
  onClosePopover,
}: CopyFlashcardsContentProps) {
  const [generatedText, setGeneratedText] = useState('');

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

  const handleCopy = () => {
    if (cards.length === 0) {
      toast.error("No cards to copy.");
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
      <h4 className="font-medium leading-none mb-2">Copy Flashcards to Clipboard</h4>
      <div className="space-y-2">
        <Label>Column Separator</Label>
        <RadioGroup value={colSep} onValueChange={setColSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="," id="col-comma-copy" /><Label htmlFor="col-comma-copy">Comma (,)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="col-semi-copy" /><Label htmlFor="col-semi-copy">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="col-custom-copy" /><Label htmlFor="col-custom-copy">Custom</Label></div>
        </RadioGroup>
        {colSep === 'custom' && <Input placeholder="Custom separator" value={customColSep} onChange={(e) => setCustomColSep(e.target.value)} />}
      </div>
      <div className="space-y-2">
        <Label>Row Separator</Label>
        <RadioGroup value={rowSep} onValueChange={setRowSep} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="\n" id="row-newline-copy" /><Label htmlFor="row-newline-copy">New Line</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value=";" id="row-semi-copy" /><Label htmlFor="row-semi-copy">Semicolon (;)</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="row-custom-copy" /><Label htmlFor="row-custom-copy">Custom</Label></div>
        </RadioGroup>
        {rowSep === 'custom' && <Input placeholder="Custom separator" value={customRowSep} onChange={(e) => setCustomRowSep(e.target.value)} />}
      </div>
      <Textarea value={generatedText} readOnly rows={5} className="text-xs font-mono" />
      <Button onClick={handleCopy} className="w-full">Copy to Clipboard</Button>
    </div>
  );
}