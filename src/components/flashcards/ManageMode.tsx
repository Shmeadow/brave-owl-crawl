"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlashcardList } from "./FlashcardList";
import { FlashcardFormModal } from "./flashcard-form-modal";
import { CardData, Category } from "@/hooks/use-flashcards";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface ManageModeProps {
  cards: CardData[];
  categories: Category[];
  onAdd: (cardData: { front: string; back: string; category_id?: string | null }) => void;
  onUpdate: (cardData: { id?: string; front: string; back: string; category_id?: string | null }) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  isCurrentRoomWritable: boolean;
}

export function ManageMode({
  cards,
  categories,
  onAdd,
  onUpdate,
  onDelete,
  onDeleteMultiple,
  isCurrentRoomWritable,
}: ManageModeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.back.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || card.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [cards, searchTerm, categoryFilter]);

  const handleAddClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add flashcards in this room.");
      return;
    }
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (card: CardData) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to edit flashcards in this room.");
      return;
    }
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleDeleteCard = (id: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete flashcards in this room.");
      return;
    }
    onDelete(id);
  };

  const handleSaveCard = (data: { id?: string; front: string; back: string; category_id?: string | null }) => {
    if (editingCard) {
      onUpdate({ ...data, id: editingCard.id });
    } else {
      onAdd(data);
    }
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleCardSelect = (cardId: string) => {
    if (!selectionMode) return;
    const newSelectedCards = new Set(selectedCards);
    if (newSelectedCards.has(cardId)) {
      newSelectedCards.delete(cardId);
    } else {
      newSelectedCards.add(cardId);
    }
    setSelectedCards(newSelectedCards);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedCards(new Set());
  };

  const handleDeleteSelected = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete flashcards in this room.");
      return;
    }
    if (selectedCards.size > 0) {
      onDeleteMultiple(Array.from(selectedCards));
      setSelectedCards(new Set());
      setSelectionMode(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-b border-border">
        <Input
          placeholder="Search flashcards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          {selectionMode ? (
            <>
              <Button variant="outline" onClick={toggleSelectionMode}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={selectedCards.size === 0 || !isCurrentRoomWritable}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedCards.size})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={toggleSelectionMode}>
                <Edit className="mr-2 h-4 w-4" />
                Select
              </Button>
              <Button onClick={handleAddClick} disabled={!isCurrentRoomWritable}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Flashcard
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <FlashcardList
          flashcards={filteredCards}
          onEdit={handleEditClick}
          onDelete={handleDeleteCard}
          selectionMode={selectionMode}
          selectedCards={selectedCards}
          onCardSelect={handleCardSelect}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />
      </div>

      {isModalOpen && (
        <FlashcardFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCard}
          initialData={editingCard}
          categories={categories}
        />
      )}
    </div>
  );
}