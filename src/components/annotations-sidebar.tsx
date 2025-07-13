"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MessageSquare, X } from 'lucide-react';
import { AnnotationData, useAnnotations } from '@/hooks/use-annotations';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AnnotationsSidebarProps {
  noteId: string | null;
  onJumpToHighlight: (highlightId: string) => void;
  isCurrentRoomWritable: boolean;
}

export function AnnotationsSidebar({ noteId, onJumpToHighlight, isCurrentRoomWritable }: AnnotationsSidebarProps) {
  const { annotations, loading, updateAnnotation, deleteAnnotation } = useAnnotations(noteId);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState('');

  const handleEditClick = (annotation: AnnotationData) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit annotations in this room.");
      return;
    }
    setEditingAnnotationId(annotation.id);
    setEditedComment(annotation.comment || '');
  };

  const handleSaveComment = async (annotationId: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to save annotations in this room.");
      return;
    }
    await updateAnnotation(annotationId, { comment: editedComment.trim() || null });
    setEditingAnnotationId(null);
    setEditedComment('');
  };

  const handleDeleteClick = async (annotationId: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete annotations in this room.");
      return;
    }
    await deleteAnnotation(annotationId);
  };

  if (!noteId) {
    return (
      <Card className="h-full flex flex-col bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-lg">Annotations</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 flex items-center justify-center">
          <p className="text-muted-foreground text-sm text-center">Select a note to view its annotations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-lg">Annotations ({annotations.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <MessageSquare className="h-5 w-5 animate-pulse text-primary" />
            <span className="ml-2 text-muted-foreground text-sm">Loading annotations...</span>
          </div>
        ) : annotations.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm text-center">No annotations for this note yet. Highlight text in the note to create one!</p>
        ) : (
          <ScrollArea className="flex-1 h-full">
            <div className="p-2 space-y-2">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="flex flex-col p-2 border rounded-md bg-muted/50 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-left flex-1 justify-start text-primary hover:underline truncate"
                      onClick={() => onJumpToHighlight(annotation.highlight_id)}
                      title="Jump to highlight"
                    >
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{annotation.highlighted_text || 'Highlighted Text'}</span>
                    </Button>
                    <div className="flex gap-1">
                      {editingAnnotationId === annotation.id ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-500 hover:bg-green-100"
                          onClick={() => handleSaveComment(annotation.id)}
                          title="Save comment"
                          disabled={!isCurrentRoomWritable}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditClick(annotation)}
                          title="Edit comment"
                          disabled={!isCurrentRoomWritable}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-100"
                        onClick={() => handleDeleteClick(annotation.id)}
                        title="Delete annotation"
                        disabled={!isCurrentRoomWritable}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {editingAnnotationId === annotation.id ? (
                    <Input
                      value={editedComment}
                      onChange={(e) => setEditedComment(e.target.value)}
                      onBlur={() => handleSaveComment(annotation.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveComment(annotation.id)}
                      placeholder="Add a comment..."
                      className="text-sm h-8"
                      autoFocus
                      disabled={!isCurrentRoomWritable}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground pl-6">
                      {annotation.comment || 'No comment added.'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}