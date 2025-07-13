"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Star, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteData } from "@/hooks/use-notes";
import { toast } from "sonner";
import { RichTextEditor } from "./rich-text-editor"; // Import the enhanced editor
import { AnnotationData, useAnnotations } from "@/hooks/use-annotations"; // Import annotation hook and type
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NoteItemProps {
  note: NoteData;
  onToggleStar: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  isCurrentRoomWritable: boolean;
  onUpdateNoteContent: (noteId: string, newContent: string) => void; // New prop for content updates
  onUpdateNoteTitle: (noteId: string, newTitle: string) => void; // New prop for title updates
  onSelectNoteForAnnotations: (noteId: string | null) => void; // New prop to select note for annotations sidebar
  activeNoteForAnnotations: string | null; // New prop to indicate if this note is active for annotations
}

export function NoteItem({
  note,
  onToggleStar,
  onDelete,
  isCurrentRoomWritable,
  onUpdateNoteContent,
  onUpdateNoteTitle,
  onSelectNoteForAnnotations,
  activeNoteForAnnotations,
}: NoteItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(note.title || '');
  const [isEditingContent, setIsEditingContent] = useState(false); // State to control editor's editable mode
  const [isAnnotationCommentDialogOpen, setIsAnnotationCommentDialogOpen] = useState(false);
  const [currentAnnotationToEdit, setCurrentAnnotationToEdit] = useState<AnnotationData | null>(null);

  const { annotations, addAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations(note.id);

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

  const handleContentChange = useCallback((newContent: string) => {
    onUpdateNoteContent(note.id, newContent);
  }, [note.id, onUpdateNoteContent]);

  const handleAddAnnotation = useCallback(async (highlightId: string, highlightedText: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add annotations in this room.");
      return null;
    }
    const newAnno = await addAnnotation({
      note_id: note.id,
      highlight_id: highlightId,
      highlighted_text: highlightedText,
      comment: null, // Initial comment is null
    });
    if (newAnno) {
      setCurrentAnnotationToEdit(newAnno);
      setIsAnnotationCommentDialogOpen(true);
    }
    return newAnno;
  }, [isCurrentRoomWritable, addAnnotation, note.id]);

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
    if (activeNoteForAnnotations === note.id) {
      onSelectNoteForAnnotations(null); // Deselect if already active
    } else {
      onSelectNoteForAnnotations(note.id); // Select this note
    }
  };

  return (
    <>
      <div className="flex items-start justify-between p-3 border rounded-md bg-card backdrop-blur-xl text-card-foreground shadow-sm">
        <div className="flex-1 pr-2">
          {isEditingTitle ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="font-semibold text-lg mb-2"
              autoFocus
              disabled={!isCurrentRoomWritable}
            />
          ) : (
            <h4
              className="font-semibold text-lg mt-0 mb-2 cursor-pointer hover:text-primary"
              onDoubleClick={handleTitleDoubleClick}
              title="Double click to edit title"
            >
              {note.title || 'Untitled Note'}
            </h4>
          )}
          <RichTextEditor
            content={note.content}
            onChange={handleContentChange}
            disabled={!isCurrentRoomWritable}
            noteId={note.id}
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onUpdateAnnotationComment={handleUpdateAnnotationComment}
          />
          <p className="text-xs text-muted-foreground mt-2">
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
            onClick={handleToggleStarClick}
            disabled={!isCurrentRoomWritable}
          >
            <Star className={cn("h-4 w-4", note.starred && "fill-current")} />
            <span className="sr-only">Toggle Star</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              activeNoteForAnnotations === note.id ? "text-primary" : "text-muted-foreground hover:bg-accent"
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
            className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-600"
            onClick={handleDeleteClick}
            disabled={!isCurrentRoomWritable}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete Note</span>
          </Button>
        </div>
      </div>

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