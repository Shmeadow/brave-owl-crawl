"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Trash2, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteData } from "@/hooks/use-notes";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface NoteItemProps {
  note: NoteData;
  onToggleStar: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  isCurrentRoomWritable: boolean;
  onUpdateNoteContent: (noteId: string, newContent: string) => void;
  onUpdateNoteTitle: (noteId: string, newTitle: string) => void;
}

export function NoteItem({
  note,
  onToggleStar,
  onDelete,
  isCurrentRoomWritable,
  onUpdateNoteContent,
  onUpdateNoteTitle,
}: NoteItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(note.title || '');
  const [isContentOpen, setIsContentOpen] = useState(false);

  const handleToggleStarClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to star/unstar notes in this room.");
      return;
    }
    onToggleStar(note.id);
  };

  const handleDeleteClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete notes in this room.");
      return;
    }
    onDelete(note.id);
  };

  const handleTitleDoubleClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit notes in this room.");
      return;
    }
    setIsEditingTitle(true);
    setEditedTitle(note.title || '');
  };

  const handleSaveTitle = () => {
    if (!isCurrentRoomWritable) return;
    if (editedTitle.trim() !== (note.title || '')) {
      onUpdateNoteTitle(note.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNoteContent(note.id, e.target.value);
  };

  return (
    <Card className={cn(
      "w-full bg-card backdrop-blur-xl border-white/20 shadow-sm transition-all duration-200 ease-in-out",
      "hover:shadow-md hover:border-primary/50",
    )}>
      <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen}>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          {isEditingTitle ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="font-semibold text-lg flex-1 mr-2 h-9"
              autoFocus
              disabled={!isCurrentRoomWritable}
            />
          ) : (
            <CardTitle
              className="text-lg font-semibold flex-1 mr-2 cursor-pointer hover:text-primary truncate"
              onDoubleClick={handleTitleDoubleClick}
              title="Double click to edit title"
            >
              {note.title || 'Untitled Note'}
            </CardTitle>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                note.starred ? "text-yellow-500 hover:bg-yellow-100" : "text-muted-foreground hover:bg-accent"
              )}
              onClick={handleToggleStarClick}
              disabled={!isCurrentRoomWritable}
              title="Toggle Star"
            >
              <Star className={cn("h-4 w-4", note.starred && "fill-current")} />
              <span className="sr-only">Toggle Star</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600"
              onClick={handleDeleteClick}
              disabled={!isCurrentRoomWritable}
              title="Delete Note"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete Note</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isContentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">Toggle Content</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            {new Date(note.created_at).toLocaleString()}
          </p>
          <CollapsibleContent>
            <div className="pt-2 border-t border-border/50">
              <textarea
                value={note.content}
                onChange={handleContentChange}
                className="w-full p-2 border rounded-md bg-input text-foreground text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                disabled={!isCurrentRoomWritable}
              />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}