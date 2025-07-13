"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Star, Trash2, MessageSquare, ChevronDown, ChevronUp, Edit } from "lucide-react"; // Added Edit icon
import { cn } from "@/lib/utils";
import { NoteData } from "@/hooks/use-notes"; // Still using NoteData as the base type
import { toast } from "sonner";
import { RichTextEditor } from "./rich-text-editor";
import { AnnotationData, useAnnotations } from "@/hooks/use-annotations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components

interface EntryItemProps {
  entry: NoteData; // Renamed from 'note' to 'entry'
  onToggleStar: (entryId: string) => void; // Renamed from 'noteId'
  onDelete: (entryId: string) => void; // Renamed from 'noteId'
  isCurrentRoomWritable: boolean;
  onUpdateEntryContent: (entryId: string, newContent: string) => void; // Renamed from 'noteId'
  onUpdateEntryTitle: (entryId: string, newTitle: string) => void; // Renamed from 'noteId'
  onSelectEntryForAnnotations: (entryId: string | null) => void; // Renamed from 'noteId'
  activeEntryForAnnotations: string | null; // Renamed from 'noteId'
}

export function EntryItem({
  entry,
  onToggleStar,
  onDelete,
  isCurrentRoomWritable,
  onUpdateEntryContent,
  onUpdateEntryTitle,
  onSelectEntryForAnnotations,
  activeEntryForAnnotations,
}: EntryItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(entry.title || '');
  const [isAnnotationCommentDialogOpen, setIsAnnotationCommentDialogOpen] = useState(false);
  const [currentAnnotationToEdit, setCurrentAnnotationToEdit] = useState<AnnotationData | null>(null);
  const [isContentOpen, setIsContentOpen] = useState(false);

  const { annotations, addAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations(entry.id);

  const handleToggleStarClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to star/unstar entries in this room.");
      return;
    }
    onToggleStar(entry.id);
  };

  const handleDeleteClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete entries in this room.");
      return;
    }
    onDelete(entry.id);
  };

  const handleTitleDoubleClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit entries in this room.");
      return;
    }
    setIsEditingTitle(true);
    setEditedTitle(entry.title || '');
  };

  const handleSaveTitle = () => {
    if (!isCurrentRoomWritable) return;
    if (editedTitle.trim() !== (entry.title || '')) {
      onUpdateEntryTitle(entry.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleContentChange = useCallback((newContent: string) => {
    onUpdateEntryContent(entry.id, newContent);
  }, [entry.id, onUpdateEntryContent]);

  const handleAddAnnotation = useCallback(async (highlightId: string, highlightedText: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add annotations in this room.");
      return null;
    }
    const newAnno = await addAnnotation({
      note_id: entry.id, // Still refers to note_id in DB, but conceptually entry_id
      highlight_id: highlightId,
      highlighted_text: highlightedText,
      comment: null,
    });
    if (newAnno) {
      setCurrentAnnotationToEdit(newAnno);
      setIsAnnotationCommentDialogOpen(true);
    }
    return newAnno;
  }, [isCurrentRoomWritable, addAnnotation, entry.id]);

  const handleDeleteAnnotation = useCallback((highlightId: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete annotations in this room.");
      return;
    }
    const annotationToDelete = annotations.find(a => a.highlight_id === highlightId);
    if (annotationToDelete) {
      deleteAnnotation(annotationToDelete.id);
    }
  }, [isCurrentRoomWritable, annotations, deleteAnnotation]);

  const handleUpdateAnnotationComment = useCallback((annotationId: string, comment: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to update annotations in this room.");
      return;
    }
    updateAnnotation(annotationId, { comment });
  }, [isCurrentRoomWritable, updateAnnotation]);

  const handleSaveAnnotationCommentDialog = () => {
    if (currentAnnotationToEdit) {
      handleUpdateAnnotationComment(currentAnnotationToEdit.id, currentAnnotationToEdit.comment || '');
    }
    setIsAnnotationCommentDialogOpen(false);
    setCurrentAnnotationToEdit(null);
  };

  const handleAnnotationCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentAnnotationToEdit) {
      setCurrentAnnotationToEdit({ ...currentAnnotationToEdit, comment: e.target.value });
    }
  };

  const handleToggleAnnotationsSidebar = () => {
    if (activeEntryForAnnotations === entry.id) {
      onSelectEntryForAnnotations(null);
    } else {
      onSelectEntryForAnnotations(entry.id);
    }
  };

  return (
    <>
      <Card className={cn(
        "w-full bg-card backdrop-blur-xl border-white/20 shadow-sm transition-all duration-200 ease-in-out",
        "hover:shadow-md hover:border-primary/50",
        activeEntryForAnnotations === entry.id && "ring-2 ring-primary border-primary"
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
                {entry.title || 'Untitled Entry'}
              </CardTitle>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  entry.starred ? "text-yellow-500 hover:bg-yellow-100" : "text-muted-foreground hover:bg-accent"
                )}
                onClick={handleToggleStarClick}
                disabled={!isCurrentRoomWritable}
                title="Toggle Star"
              >
                <Star className={cn("h-4 w-4", entry.starred && "fill-current")} />
                <span className="sr-only">Toggle Star</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  activeEntryForAnnotations === entry.id ? "text-primary" : "text-muted-foreground hover:bg-accent"
                )}
                onClick={handleToggleAnnotationsSidebar}
                title="View Annotations"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">View Annotations</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600"
                onClick={handleDeleteClick}
                disabled={!isCurrentRoomWritable}
                title="Delete Entry"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Entry</span>
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
              {new Date(entry.created_at).toLocaleString()}
            </p>
            <CollapsibleContent>
              <div className="pt-2 border-t border-border/50">
                <RichTextEditor
                  content={entry.content}
                  onChange={handleContentChange}
                  disabled={!isCurrentRoomWritable}
                  noteId={entry.id} // Pass entry.id as noteId for annotations
                  annotations={annotations}
                  onAddAnnotation={handleAddAnnotation}
                  onDeleteAnnotation={handleDeleteAnnotation}
                  onUpdateAnnotationComment={handleUpdateAnnotationComment}
                />
              </div>
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>

      <Dialog open={isAnnotationCommentDialogOpen} onOpenChange={setIsAnnotationCommentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Comment to Highlight</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="highlighted-text" className="text-right">
                Text
              </Label>
              <Input
                id="highlighted-text"
                value={currentAnnotationToEdit?.highlighted_text || ''}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right">
                Comment
              </Label>
              <Input
                id="comment"
                value={currentAnnotationToEdit?.comment || ''}
                onChange={handleAnnotationCommentChange}
                placeholder="Add a short description..."
                className="col-span-3"
                disabled={!isCurrentRoomWritable}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAnnotationCommentDialogOpen(false)}>
              Skip
            </Button>
            <Button type="submit" onClick={handleSaveAnnotationCommentDialog} disabled={!isCurrentRoomWritable}>
              Save Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}