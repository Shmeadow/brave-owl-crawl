"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteData } from "@/hooks/use-notes";

interface NoteItemProps {
  note: NoteData;
  onToggleStar: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

export function NoteItem({ note, onToggleStar, onDelete }: NoteItemProps) {
  return (
    <div className="flex items-start justify-between p-3 border rounded-md bg-card backdrop-blur-xl text-card-foreground shadow-sm">
      <div className="flex-1 pr-2">
        <p className="text-sm">{note.content}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(note.created_at).toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            note.starred ? "text-yellow-500 hover:bg-yellow-100" : "text-muted-foreground hover:bg-accent"
          )}
          onClick={() => onToggleStar(note.id)}
        >
          <Star className={cn("h-4 w-4", note.starred && "fill-current")} />
          <span className="sr-only">Toggle Star</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600"
          onClick={() => onDelete(note.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Note</span>
        </Button>
      </div>
    </div>
  );
}