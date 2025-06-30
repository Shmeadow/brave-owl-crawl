"use client";

import React, { useState, useId } from "react"; // Added useId
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Star, CheckCircle, Edit, Trash2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditFlashCardForm } from "@/components/edit-flash-card-form";
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

interface CardData {
  id: string;
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learned';
  seen: boolean;
}

interface FlashCardListSidebarProps {
  cards: CardData[];
  currentCardIndex: number;
  onSelectCard: (index: number) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, updatedData: { front: string; back: string }) => void;
  onToggleStar: (cardId: string) => void;
  onMarkAsLearned: (cardId: string) => void;
  onReorderCards: (newOrder: CardData[]) => void; // New prop for reordering
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
}

function SortableFlashCardItem({
  card,
  index,
  currentCardIndex,
  onSelectCard,
  onDeleteCard,
  onUpdateCard,
  onToggleStar,
  onMarkAsLearned,
}: SortableFlashCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0, // Bring dragged item to front
    opacity: isDragging ? 0.7 : 1,
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const dialogTitleId = useId(); // Generate a unique ID for the dialog title

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting card when clicking edit
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedData: { front: string; back: string }) => {
    onUpdateCard(card.id, updatedData);
    setIsEditDialogOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        index === currentCardIndex && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
        isDragging && "ring-2 ring-primary"
      )}
      onClick={() => onSelectCard(index)}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 cursor-grab",
            index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent"
          )}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
          <span className="sr-only">Drag to reorder</span>
        </Button>
        <div className="flex-1 truncate pr-2">
          <p className="font-medium text-sm">{card.front}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {card.starred && <Star className={cn("h-3 w-3", index === currentCardIndex ? "text-yellow-300" : "text-yellow-500")} fill="currentColor" />}
            {card.status === 'learned' && <CheckCircle className={cn("h-3 w-3", index === currentCardIndex ? "text-green-300" : "text-green-500")} fill="currentColor" />}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
          onClick={(e) => { e.stopPropagation(); onToggleStar(card.id); }}
        >
          <Star className={cn("h-4 w-4", card.starred && (index === currentCardIndex ? "text-yellow-300" : "text-yellow-500"))} fill="currentColor" />
          <span className="sr-only">Toggle Star</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
          onClick={(e) => { e.stopPropagation(); onMarkAsLearned(card.id); }}
        >
          <CheckCircle className={cn("h-4 w-4", card.status === 'learned' && (index === currentCardIndex ? "text-green-300" : "text-green-500"))} fill="currentColor" />
          <span className="sr-only">Mark as Learned</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", index === currentCardIndex ? "text-primary-foreground hover:bg-primary/80" : "text-muted-foreground hover:bg-accent")}
          onClick={handleEditClick}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit Card</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", index === currentCardIndex ? "text-red-300 hover:bg-primary/80" : "text-red-500 hover:bg-accent")}
          onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Card</span>
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-labelledby={dialogTitleId}>
          <DialogHeader>
            <DialogTitle id={dialogTitleId}>Edit Flashcard</DialogTitle>
          </DialogHeader>
          <EditFlashCardForm
            initialData={{ front: card.front, back: card.back }}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
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
        onSelectCard(newIndex); // Select the card at its new position
      }
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Your Flashcards</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {cards.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm">No flashcards added yet.</p>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={cards.map(card => card.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-4 space-y-2">
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