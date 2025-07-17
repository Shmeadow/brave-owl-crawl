"use client";

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardData, Category } from '@/hooks/flashcards/types';
import { toast } from 'sonner';

interface OrganizeCardModalProps {
  card: CardData | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (categoryId: string, deleteContents: boolean) => void;
}

export function OrganizeCardModal({ card, categories, isOpen, onClose, onConfirm }: OrganizeCardModalProps) {
  if (!card) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{category.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Please choose how to handle the flashcards within this category.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button
            variant="destructive"
            onClick={() => onConfirm(category.id, true)}
          >
            Delete Category & ALL Flashcards Inside
          </Button>
          <Button
            variant="outline"
            onClick={() => onConfirm(category.id, false)}
          >
            Delete Category Only (Keep Flashcards)
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}