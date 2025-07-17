"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { JournalEntryData } from "@/hooks/use-journal";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamically import TrixEditor with SSR disabled
const DynamicTrixEditor = dynamic(() => import("./trix-editor").then(mod => mod.TrixEditor), { ssr: false });

interface JournalEntryItemProps {
  entry: JournalEntryData;
  onToggleStar: (entryId: string) => void;
  onDelete: (entryId: string) => void;
  isCurrentRoomWritable: boolean;
  onUpdateEntryContent: (entryId: string, newContent: string) => void;
  onUpdateEntryTitle: (entryId: string, newTitle: string) => void;
}

export function JournalEntryItem({
  entry,
  onToggleStar,
  onDelete,
  isCurrentRoomWritable,
  onUpdateEntryContent,
  onUpdateEntryTitle,
}: JournalEntryItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitlePrefix, setEditedTitlePrefix] = useState('');
  const [datePart, setDatePart] = useState('');
  const [isContentOpen, setIsContentOpen] = useState(false);

  const handleToggleStarClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to star/unstar journal entries in this room.");
      return;
    }
    onToggleStar(entry.id);
  };

  const handleDeleteClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete journal entries in this room.");
      return;
    }
    onDelete(entry.id);
  };

  const handleTitleDoubleClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit journal entries in this room.");
      return;
    }
    const titleParts = entry.title?.split(' - ');
    if (titleParts && titleParts.length > 1 && /\d/.test(titleParts[titleParts.length - 1])) {
        setEditedTitlePrefix(titleParts.slice(0, -1).join(' - '));
        setDatePart(titleParts.slice(-1)[0]);
    } else {
        setEditedTitlePrefix(entry.title || '');
        setDatePart('');
    }
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!isCurrentRoomWritable) return;
    const newTitle = datePart ? `${editedTitlePrefix.trim()} - ${datePart}` : editedTitlePrefix.trim();
    if (newTitle.trim() !== (entry.title || '')) {
      onUpdateEntryTitle(entry.id, newTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleContentChange = useCallback((newContent: string) => {
    onUpdateEntryContent(entry.id, newContent);
  }, [entry.id, onUpdateEntryContent]);

  const handleCollapsibleOpenChange = (open: boolean) => {
    setIsContentOpen(open);
  };

  return (
    <Card className={cn(
      "w-full bg-card backdrop-blur-xl border-white/20 shadow-sm transition-all duration-200 ease-in-out",
      "hover:shadow-md hover:border-primary/50"
    )}>
      <Collapsible open={isContentOpen} onOpenChange={handleCollapsibleOpenChange}>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1 mr-2 w-full">
              <Input
                value={editedTitlePrefix}
                onChange={(e) => setEditedTitlePrefix(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="font-semibold text-lg h-9"
                autoFocus
                disabled={!isCurrentRoomWritable}
              />
              {datePart && <span className="text-muted-foreground whitespace-nowrap">- {datePart}</span>}
            </div>
          ) : (
            <CardTitle
              className="text-lg font-semibold flex-1 mr-2 cursor-pointer hover:text-primary truncate"
              onDoubleClick={handleTitleDoubleClick}
              title="Double click to edit title"
            >
              {entry.title || 'Untitled Entry'}
            </CardTitle>
          )}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9",
                entry.starred ? "text-yellow-500 hover:bg-yellow-100" : "text-muted-foreground hover:bg-accent"
              )}
              onClick={handleToggleStarClick}
              disabled={!isCurrentRoomWritable}
              title="Toggle Star"
            >
              <Star className={cn("h-5 w-5", entry.starred && "fill-current")} />
              <span className="sr-only">Toggle Star</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-red-500 hover:bg-red-100 hover:text-red-600"
              onClick={handleDeleteClick}
              disabled={!isCurrentRoomWritable}
              title="Delete Entry"
            >
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Delete Entry</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {isContentOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
              <DynamicTrixEditor
                content={entry.content}
                onChange={handleContentChange}
                disabled={!isCurrentRoomWritable}
              />
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}