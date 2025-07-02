"use client";

import React, { useState, useId } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Star, CheckCircle, Edit, Trash2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditFlashCardForm } from "@/components/edit-flash-card-form";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardData } from "@/hooks/use-flashcards";

interface FlashCardListSidebarProps {
  cards: CardData[];
  currentCardIndex: number;
  onSelectCard: (index: number) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, updatedData: { front: string; back: string }) => void;
  onToggleStar: (cardId: string) => void;
  onMarkAsLearned: (cardId: string) => void;
  onReorderCards: (newOrder: CardData[]) => void;
  isCurrentRoomWritable: boolean;
}

interface SortableFlashCardItemProps {
  card: CardData;
  index: number;
  currentCardIndex: number;
  onSelectCard: (index: number) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, updatedData: { front: string; back: string }) => void;
  onToggleStar: (cardId: string) => void;
  onMarkAsLearned: (cardId: string) => void;
  isCurrentRoomWritable: boolean;
}

function SortableFlashCardItem({
  card,
  index,
  currentCardIndex,
  onSelectCard,
  onDeleteCard,
  onUpdateCard,
  onToggleStar,
  onMarkAsLearLearned,
  isCurrentRoomWritable,
}: SortableFlashCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: !isCurrentRoomWritable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.7 : 1,
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const dialogTitleId = useId();

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit flashcards in this room.");
      return;
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedData: { front: string; back: string }) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit flashcards in this room.");
      return;
    }
    onUpdateCard(card.id, updatedData);
    setIsEditDialogOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete flashcards in this room.");
      return;
    }
    onDeleteCard(card.id);
  };

  const handleToggleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to star/unstar flashcards in this room.");
      return;
    }
    onToggleStar(card.id);
  };

  const handleMarkAsLearnedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to mark flashcards as learned in this room.");
      return;
    }
    onMarkAsLearned(card.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-2 border rounded-md transition-colors",
        "hover:bg-accent hover:text-accent-foreground backdrop-blur-xl",
        index === currentCardIndex && "bg-primary text-primary-foreground backdrop-blur-xl",
        isDragging && "ring-2 ring-primary",
        isCurrentRoomWritable ? "cursor-pointer" : "cursor-not-allowed opacity-70"
      )}
      onClick={() => onSelectCard(index)}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6",
            index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent",
            !isCurrentRoomWritable ? "cursor-not-allowed opacity-50" : "cursor-grab"
          )}
          {...(isCurrentRoomWritable && { ...listeners, ...attributes })}
          disabled={!isCurrentRoomWritable}
        >
          <GripVertical className="h-3.5 w-3.5" />
          <span className="sr-only">Drag to reorder</span>
        </Button>
        <div className="flex-1 truncate pr-2">
          <p className="font-medium text-xs">{card.front}</p>
          <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground mt-1">
            {card.starred && <Star className={cn("h-3 w-3", index === currentCardIndex ? "text-yellow-300" : "text-yellow-500")} fill="currentColor" />}
            {card.status === 'mastered' && <CheckCircle className={cn("h-3 w-3", index === currentCardIndex ? "text-green-300" : "text-green-500")} fill="currentColor" />}
            {card.seen_count > 0 && <span className="ml-1">({card.seen_count} views)</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
          onClick={handleToggleStarClick}
          disabled={!isCurrentRoomWritable}
        >
          <Star className={cn("h-3.5 w-3.5", card.starred && (index === currentCardIndex ? "text-yellow-300" : "text-yellow-500"))} fill="currentColor" />
          <span className="sr-only">Toggle Star</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
          onClick={handleMarkAsLearnedClick}
          disabled={!isCurrentRoomWritable}
        >
          <CheckCircle className={cn("h-3.5 w-3.5", card.status === 'mastered' && (index === currentCardIndex ? "text-green-300" : "text-green-500"))} fill="currentColor" />
          <span className="sr-only">Mark as Learned</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
          onClick={handleEditClick}
          disabled={!isCurrentRoomWritable}
        >
          <Edit className="h-3.5 w-3.5" />
          <span className="sr-only">Edit Card</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6", index === currentCardIndex ? "text-red-300 hover:bg-primary/80" : "text-red-500 hover:bg-accent")}
          onClick={handleDeleteClick}
          disabled={!isCurrentRoomWritable}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete Card</span>
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-labelledby={dialogTitleId}>
          <DialogHeader>
            <DialogTitle id={dialogTitleId}>Edit Flashcard</DialogTitle>
          </DialogHeader>
          {card && (
            <EditFlashCardForm
              initialData={{ front: card.front, back: card.back }}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              isCurrentRoomWritable={isCurrentRoomWritable}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FlashCardListSidebar({
  cards,
  currentCardIndex,
  onSelectCard,
  onDeleteCard,
  onUpdateCard,
  onToggleStar,
  onMarkAsLearned,
  onReorderCards,
  isCurrentRoomWritable,
}: FlashCardListSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = cards.findIndex(card => card.id === active.id);
      const newIndex = cards.findIndex(card => card.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCards = [...cards];
        const [movedCard] = newCards.splice(oldIndex, 1);
        newCards.splice(newIndex, 0, movedCard);
        onReorderCards(newCards);
        onSelectCard(newIndex);
      }
    }
  }

  return (
    <Card className="h-full flex flex-col bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="text-lg">Your Flashcards</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        {cards.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm">No flashcards added yet.</p>
        ) : (
          <ScrollArea className="flex-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={cards.map(card => card.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-2 space-y-1">
                  {cards.map((card, index) => (
                    <SortableFlashCardItem
                      key={card.id}
                      card={card}
                      index={index}
                      currentCardIndex={currentCardIndex}
                      onSelectCard={onSelectCard}
                      onDeleteCard={onDeleteCard}
                      onUpdateCard={onUpdateCard}
                      onToggleStar={onToggleStar}
                      onMarkAsLearned={onMarkAsLearned}
                      isCurrentRoomWritable={isCurrentRoomWritable}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}