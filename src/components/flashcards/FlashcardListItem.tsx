"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardData } from "@/hooks/use-flashcards";
import { toast } from "sonner";

interface FlashcardListItemProps {
  card: CardData;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: (cardId: string) => void;
  onEdit: (card: CardData) => void;
  onDelete: (cardId: string) => void;
  isCurrentRoomWritable: boolean;
}

export function FlashcardListItem({ card, selectionMode, isSelected, onSelect, onEdit, onDelete, isCurrentRoomWritable }: FlashcardListItemProps) {
  const handleSelect = () => {
    if (selectionMode) {
      onSelect(card.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit flashcards in this room.");
      return;
    }
    onEdit(card);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete flashcards in this room.");
      return;
    }
    onDelete(card.id);
  };

  return (
    <li
      className={cn(
        "flex flex-col justify-between bg-muted backdrop-blur-xl p-4 rounded-lg shadow-sm border border-border transition-all duration-200",
        selectionMode ? "cursor-pointer" : "hover:shadow-lg hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={handleSelect}
    >
      <div>
        <div className="mb-2">
          <p className="text-xs text-muted-foreground">Front</p>
          <p className="font-medium break-words">{card.front}</p>
        </div>
        <div className="border-t border-border my-2"></div>
        <div>
          <p className="text-xs text-muted-foreground">Back</p>
          <p className="font-medium break-words">{card.back}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleEdit}
          disabled={!isCurrentRoomWritable}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600"
          onClick={handleDelete}
          disabled={!isCurrentRoomWritable}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </li>
  );
}