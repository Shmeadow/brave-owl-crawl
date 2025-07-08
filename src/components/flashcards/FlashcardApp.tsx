"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFlashcards } from "@/hooks/use-flashcards";
import { ManageMode } from "./ManageMode";
import { StudyMode } from "./StudyMode";
import { Loader2 } from "lucide-react";
import { useCurrentRoom } from "@/hooks/use-current-room";

export function FlashcardApp() {
  const {
    cards,
    categories,
    loading,
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleDeleteMultipleCards,
    handleAddCategory,
    handleUpdateCardCategory,
  } = useFlashcards();
  const { isCurrentRoomWritable } = useCurrentRoom();
  const [activeTab, setActiveTab] = useState("study");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex justify-center p-2 border-b border-border">
          <TabsList>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="study" className="flex-1 overflow-auto">
          <StudyMode
            cards={cards}
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCardCategory={handleUpdateCardCategory}
            isCurrentRoomWritable={isCurrentRoomWritable}
          />
        </TabsContent>
        <TabsContent value="manage" className="flex-1 overflow-auto">
          <ManageMode
            cards={cards}
            onAdd={handleAddCard}
            onDelete={handleDeleteCard}
            onUpdate={handleUpdateCard}
            onDeleteMultiple={handleDeleteMultipleCards}
            categories={categories}
            isCurrentRoomWritable={isCurrentRoomWritable}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}