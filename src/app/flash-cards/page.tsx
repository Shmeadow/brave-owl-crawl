"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FlashCardDeck } from "@/components/flash-card-deck";
import { FlashCardListSidebar } from "@/components/flash-card-list-sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";

export interface CardData {
  id: string;
  user_id: string;
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learning' | 'mastered'; // 'new', 'learning', 'mastered'
  seen_count: number; // How many times this card has been seen/interacted with
  last_reviewed_at: string | null; // ISO string date
  interval_days: number; // For spaced repetition
}

type FilterMode = 'all' | 'starred' | 'learned';

export default function FlashCardsPage() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!session || !supabase) {
      // If no session or supabase client, load an empty set of cards
      setCards([]);
      setLoading(false);
      toast.info("You are browsing flashcards as a guest. Log in to save your progress and cards.");
      return;
    }

    const fetchCards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error("Error fetching flashcards: " + error.message);
        console.error("Error fetching flashcards:", error);
      } else {
        setCards(data as CardData[]);
      }
      setLoading(false);
    };

    fetchCards();
  }, [session, supabase, authLoading]); // Depend on session and supabase

  // Adjust currentCardIndex if it goes out of bounds after filtering
  const filteredCards = cards.filter(card => {
    if (filterMode === 'starred') {
      return card.starred;
    }
    if (filterMode === 'learned') {
      return card.status === 'mastered'; // 'learned' maps to 'mastered' status
    }
    // For 'all' mode, also consider next_review_at for spaced repetition
    const now = new Date();
    const nextReview = card.last_reviewed_at ? new Date(card.last_reviewed_at) : new Date(0); // Treat null as ready for review
    nextReview.setDate(nextReview.getDate() + card.interval_days);
    return now >= nextReview;
  });

  useEffect(() => {
    if (filteredCards.length > 0 && currentCardIndex >= filteredCards.length) {
      setCurrentCardIndex(0);
    } else if (filteredCards.length === 0) {
      setCurrentCardIndex(0); // Reset index if no cards match filter
    }
  }, [filterMode, filteredCards.length, currentCardIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % filteredCards.length);
      toast.info("Next card!");
    }, 100);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      setCurrentCardIndex((prevIndex) =>
        prevIndex === 0 ? filteredCards.length - 1 : prevIndex - 1
      );
      toast.info("Previous card!");
    }, 100);
  };

  const handleAddCard = async (newCardData: { front: string; back: string }) => {
    if (!session || !supabase) {
      toast.error("Please log in to add flashcards.");
      return;
    }
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        user_id: session.user.id,
        front: newCardData.front,
        back: newCardData.back,
        starred: false,
        status: 'new',
        seen_count: 0,
        last_reviewed_at: null,
        interval_days: 0,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error adding flashcard: " + error.message);
      console.error("Error adding flashcard:", error);
    } else if (data) {
      setCards((prevCards) => [...prevCards, data as CardData]);
      toast.success("Flashcard added successfully!");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!session || !supabase) {
      toast.error("Please log in to delete flashcards.");
      return;
    }
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', session.user.id);

    if (error) {
      toast.error("Error deleting flashcard: " + error.message);
      console.error("Error deleting flashcard:", error);
    } else {
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      setCurrentCardIndex(0); // Reset index for simplicity after deletion
      setIsFlipped(false);
      toast.success("Flashcard deleted.");
    }
  };

  const handleShuffleCards = () => {
    if (filteredCards.length <= 1) {
      toast.info("Need at least two cards to shuffle.");
      return;
    }
    // For now, shuffling only affects the display order, not the database order.
    // A true shuffle would involve re-fetching based on a random order or updating a 'sort_order' column.
    // Since we're filtering by next_review_at, a simple client-side shuffle might not be ideal for learning.
    // For now, let's just reset seen counts and status for the *displayed* cards.
    setCards(prevCards => prevCards.map(card => {
      if (filteredCards.some(fc => fc.id === card.id)) {
        return { ...card, seen_count: 0, status: 'new', last_reviewed_at: null, interval_days: 0 };
      }
      return card;
    }));
    setCurrentCardIndex(0);
    setIsFlipped(false);
    toast.success("Flashcards shuffled and progress reset for displayed cards!");
  };

  const handleToggleStar = async (cardId: string) => {
    if (!session || !supabase) {
      toast.error("Please log in to star flashcards.");
      return;
    }
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newStarredStatus = !cardToUpdate.starred;
    const { data, error } = await supabase
      .from('flashcards')
      .update({ starred: newStarredStatus })
      .eq('id', cardId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      toast.error("Error updating star status: " + error.message);
      console.error("Error updating star status:", error);
    } else if (data) {
      setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
      toast.info(newStarredStatus ? "Card starred for later!" : "Card unstarred.");
    }
  };

  const handleMarkAsLearned = async (cardId: string) => {
    if (!session || !supabase) {
      toast.error("Please log in to mark flashcards as learned.");
      return;
    }
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newStatus = cardToUpdate.status === 'mastered' ? 'new' : 'mastered';
    const newInterval = newStatus === 'mastered' ? 7 : 0; // Example: 7 days for mastered, 0 for new
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('flashcards')
      .update({
        status: newStatus,
        last_reviewed_at: now,
        interval_days: newInterval,
      })
      .eq('id', cardId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      toast.error("Error updating card status: " + error.message);
      console.error("Error updating card status:", error);
    } else if (data) {
      setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
      toast.info(newStatus === 'mastered' ? "Card marked as learned!" : "Card marked as new.");
    }
  };

  const handleUpdateCard = async (cardId: string, updatedData: { front: string; back: string }) => {
    if (!session || !supabase) {
      toast.error("Please log in to update flashcards.");
      return;
    }
    const { data, error } = await supabase
      .from('flashcards')
      .update(updatedData)
      .eq('id', cardId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      toast.error("Error updating flashcard: " + error.message);
      console.error("Error updating flashcard:", error);
    } else if (data) {
      setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
      toast.success("Flashcard updated successfully!");
    }
  };

  const handleSelectCard = (index: number) => {
    setCurrentCardIndex(index);
    setIsFlipped(false);
  };

  const handleReorderCards = async (newOrder: CardData[]) => {
    // Reordering client-side for display, but not persisting order in DB for now.
    // To persist, you'd need a 'sort_order' column and update it for all cards.
    setCards(newOrder); // Update local state for immediate visual feedback
    toast.success("Flashcards reordered locally!");
  };

  const handleResetProgress = async () => {
    if (!session || !supabase) {
      toast.error("Please log in to reset progress.");
      return;
    }
    const { error } = await supabase
      .from('flashcards')
      .update({ seen_count: 0, status: 'new', last_reviewed_at: null, interval_days: 0 })
      .eq('user_id', session.user.id);

    if (error) {
      toast.error("Error resetting progress: " + error.message);
      console.error("Error resetting progress:", error);
    } else {
      setCards(prevCards => prevCards.map(card => ({ ...card, seen_count: 0, status: 'new', last_reviewed_at: null, interval_days: 0 })));
      setCurrentCardIndex(0);
      setIsFlipped(false);
      toast.success("All card progress reset!");
    }
  };

  if (authLoading || loading) { // Only show loading if auth is still loading or cards are loading
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full py-8">
          <p>Loading flashcards...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Flash Cards</h1>
        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={70} minSize={40}>
            <div className="flex flex-col items-center justify-center h-full p-4">
              <FlashCardDeck
                cards={filteredCards} // Pass filtered cards
                currentCardIndex={currentCardIndex}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
                onShuffleCards={handleShuffleCards}
                onToggleStar={handleToggleStar}
                onMarkAsLearned={handleMarkAsLearned}
                onUpdateCard={handleUpdateCard}
                filterMode={filterMode} // Pass filter mode
                setFilterMode={setFilterMode} // Pass setter for filter mode
                onResetProgress={handleResetProgress} // Pass reset progress handler
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full p-4">
              <FlashCardListSidebar
                cards={filteredCards} // Pass filtered cards
                currentCardIndex={currentCardIndex}
                onSelectCard={handleSelectCard}
                onDeleteCard={handleDeleteCard}
                onUpdateCard={handleUpdateCard}
                onToggleStar={handleToggleStar}
                onMarkAsLearned={handleMarkAsLearned}
                onReorderCards={handleReorderCards}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}