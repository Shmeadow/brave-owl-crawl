"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FlashCardDeck } from "@/components/flash-card-deck";
import { FlashCardListSidebar } from "@/components/flash-card-list-sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";

export interface CardData {
  id: string;
  user_id?: string; // Make user_id optional for local storage cards
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learning' | 'mastered';
  seen_count: number;
  last_reviewed_at: string | null;
  interval_days: number;
}

type FilterMode = 'all' | 'starred' | 'learned';

const LOCAL_STORAGE_KEY = 'guest_flashcards';

export default function FlashCardsPage() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isLoggedInMode, setIsLoggedInMode] = useState(false); // New state to track data source

  // Helper to update card interaction (seen_count, last_reviewed_at)
  const updateCardInteraction = useCallback(async (cardId: string) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newSeenCount = cardToUpdate.seen_count + 1;
    const now = new Date().toISOString();

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({
          seen_count: newSeenCount,
          last_reviewed_at: now,
        })
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating card interaction (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
      }
    } else {
      // Local storage update
      setCards(prevCards => {
        const updated = prevCards.map(card =>
          card.id === cardId
            ? { ...card, seen_count: newSeenCount, last_reviewed_at: now }
            : card
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [cards, isLoggedInMode, session, supabase]);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadCards = async () => {
      setLoading(true);
      if (session && supabase) {
        // User is logged in
        setIsLoggedInMode(true);
        console.log("User logged in. Checking for local cards to migrate...");

        // 1. Load local cards (if any)
        const localCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localCards: CardData[] = [];
        try {
          localCards = localCardsString ? JSON.parse(localCardsString) : [];
        } catch (e) {
          console.error("Error parsing local storage cards:", e);
          localCards = [];
        }

        // 2. Fetch user's existing cards from Supabase
        const { data: supabaseCards, error: fetchError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (fetchError) {
          toast.error("Error fetching flashcards from Supabase: " + fetchError.message);
          console.error("Error fetching flashcards (Supabase):", fetchError);
          setCards([]);
        } else {
          let mergedCards = [...(supabaseCards as CardData[])];

          // 3. Migrate local cards to Supabase if they don't already exist
          if (localCards.length > 0) {
            console.log(`Found ${localCards.length} local cards. Attempting migration...`);
            for (const localCard of localCards) {
              // Check if a similar card (by front/back) already exists in Supabase
              const existsInSupabase = mergedCards.some(
                sc => sc.front === localCard.front && sc.back === localCard.back
              );

              if (!existsInSupabase) {
                const { data: newSupabaseCard, error: insertError } = await supabase
                  .from('flashcards')
                  .insert({
                    user_id: session.user.id,
                    front: localCard.front,
                    back: localCard.back,
                    starred: localCard.starred,
                    status: localCard.status,
                    seen_count: localCard.seen_count,
                    last_reviewed_at: localCard.last_reviewed_at,
                    interval_days: localCard.interval_days,
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error migrating local card to Supabase:", insertError);
                  toast.error("Error migrating some local cards.");
                } else if (newSupabaseCard) {
                  mergedCards.push(newSupabaseCard as CardData);
                  console.log("Migrated local card:", newSupabaseCard.front);
                }
              }
            }
            // Clear local storage after migration attempt
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            toast.success("Local flashcards migrated to your account!");
          }
          setCards(mergedCards);
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const storedCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let loadedCards: CardData[] = [];
        try {
          loadedCards = storedCardsString ? JSON.parse(storedCardsString) : [];
        } catch (e) {
          console.error("Error parsing local storage cards:", e);
          loadedCards = [];
        }
        setCards(loadedCards);
        if (loadedCards.length === 0) {
          toast.info("You are browsing flashcards as a guest. Your cards will be saved locally.");
        }
      }
      setLoading(false);
      setCurrentCardIndex(0); // Reset index on load/auth change
      setIsFlipped(false);
    };

    loadCards();
  }, [session, supabase, authLoading]); // Depend on session and supabase

  // Effect to save cards to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards, isLoggedInMode, loading]);

  // Adjust currentCardIndex if it goes out of bounds after filtering
  const filteredCards = cards.filter(card => {
    if (filterMode === 'starred') {
      return card.starred;
    }
    if (filterMode === 'learned') {
      return card.status === 'mastered';
    }
    // For 'all' mode, also consider next_review_at for spaced repetition
    const now = new Date();
    const nextReview = card.last_reviewed_at ? new Date(card.last_reviewed_at) : new Date(0);
    nextReview.setDate(nextReview.getDate() + card.interval_days);
    return now >= nextReview;
  });

  useEffect(() => {
    if (filteredCards.length > 0) {
      if (currentCardIndex >= filteredCards.length) {
        setCurrentCardIndex(0);
      }
    } else {
      setCurrentCardIndex(0);
    }
    setIsFlipped(false);
  }, [filterMode, filteredCards.length]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (filteredCards.length > 0) {
      updateCardInteraction(filteredCards[currentCardIndex].id);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      const nextIndex = (currentCardIndex + 1) % filteredCards.length;
      setCurrentCardIndex(nextIndex);
      updateCardInteraction(filteredCards[nextIndex].id);
      toast.info("Next card!");
    }, 100);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      const prevIndex = currentCardIndex === 0 ? filteredCards.length - 1 : currentCardIndex - 1;
      setCurrentCardIndex(prevIndex);
      updateCardInteraction(filteredCards[prevIndex].id);
      toast.info("Previous card!");
    }, 100);
  };

  const handleAddCard = async (newCardData: { front: string; back: string }) => {
    if (isLoggedInMode && session && supabase) {
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
        toast.error("Error adding flashcard (Supabase): " + error.message);
        console.error("Error adding flashcard (Supabase):", error);
      } else if (data) {
        setCards((prevCards) => {
          const updatedCards = [...prevCards, data as CardData];
          setFilterMode('all');
          setCurrentCardIndex(updatedCards.length - 1);
          setIsFlipped(false);
          return updatedCards;
        });
        toast.success("Flashcard added successfully to your account!");
      }
    } else {
      // Guest mode: save to local storage
      const newCard: CardData = {
        id: crypto.randomUUID(), // Generate unique ID for local cards
        front: newCardData.front,
        back: newCardData.back,
        starred: false,
        status: 'new',
        seen_count: 0,
        last_reviewed_at: null,
        interval_days: 0,
      };
      setCards((prevCards) => {
        const updatedCards = [...prevCards, newCard];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
        setFilterMode('all');
        setCurrentCardIndex(updatedCards.length - 1);
        setIsFlipped(false);
        return updatedCards;
      });
      toast.success("Flashcard added successfully (saved locally)!");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error deleting flashcard (Supabase): " + error.message);
        console.error("Error deleting flashcard (Supabase):", error);
      } else {
        const updatedCards = cards.filter(card => card.id !== cardId);
        setCards(updatedCards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        toast.success("Flashcard deleted from your account.");
      }
    } else {
      // Guest mode: delete from local storage
      setCards(prevCards => {
        const updated = prevCards.filter(card => card.id !== cardId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      setCurrentCardIndex(0);
      setIsFlipped(false);
      toast.success("Flashcard deleted (locally).");
    }
  };

  const handleShuffleCards = () => {
    if (filteredCards.length <= 1) {
      toast.info("Need at least two cards to shuffle.");
      return;
    }
    const shuffledFilteredCards = [...filteredCards].sort(() => Math.random() - 0.5);
    // This shuffle only reorders the currently filtered set in the UI.
    // It does not persist to DB or local storage in this specific shuffle action.
    // If persistence is needed, a 'sort_order' column would be required.
    setCards(prevCards => {
      const newCards = [...prevCards];
      // Replace the filtered cards with their shuffled order, keeping others in place
      shuffledFilteredCards.forEach((shuffledCard, idx) => {
        const originalIndex = newCards.findIndex(card => card.id === shuffledCard.id);
        if (originalIndex !== -1) {
          newCards[originalIndex] = shuffledCard; // This is a simplified approach
        }
      });
      return newCards;
    });
    setCurrentCardIndex(0);
    setIsFlipped(false);
    toast.success("Flashcards shuffled!");
  };

  const handleToggleStar = async (cardId: string) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newStarredStatus = !cardToUpdate.starred;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({ starred: newStarredStatus })
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating star status (Supabase): " + error.message);
        console.error("Error updating star status (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
        toast.info(newStarredStatus ? "Card starred for later!" : "Card unstarred.");
      }
    } else {
      // Guest mode: update local storage
      setCards(prevCards => {
        const updated = prevCards.map(card =>
          card.id === cardId ? { ...card, starred: newStarredStatus } : card
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      toast.info(newStarredStatus ? "Card starred for later (locally)!" : "Card unstarred (locally).");
    }
  };

  const handleMarkAsLearned = async (cardId: string) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newStatus = cardToUpdate.status === 'mastered' ? 'new' : 'mastered';
    const newInterval = newStatus === 'mastered' ? 7 : 0;
    const now = new Date().toISOString();

    if (isLoggedInMode && session && supabase) {
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
        toast.error("Error updating card status (Supabase): " + error.message);
        console.error("Error updating card status (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
        toast.info(newStatus === 'mastered' ? "Card marked as learned!" : "Card marked as new.");
      }
    } else {
      // Guest mode: update local storage
      setCards(prevCards => {
        const updated = prevCards.map(card =>
          card.id === cardId
            ? { ...card, status: newStatus, last_reviewed_at: now, interval_days: newInterval }
            : card
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      toast.info(newStatus === 'mastered' ? "Card marked as learned (locally)!" : "Card marked as new (locally).");
    }
  };

  const handleUpdateCard = async (cardId: string, updatedData: { front: string; back: string }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update(updatedData)
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating flashcard (Supabase): " + error.message);
        console.error("Error updating flashcard (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
        toast.success("Flashcard updated successfully!");
      }
    } else {
      // Guest mode: update local storage
      setCards(prevCards => {
        const updated = prevCards.map(card =>
          card.id === cardId ? { ...card, ...updatedData } : card
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      toast.success("Flashcard updated successfully (locally)!");
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
    if (!isLoggedInMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newOrder));
    }
    toast.success("Flashcards reordered locally!");
  };

  const handleResetProgress = async () => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('flashcards')
        .update({ seen_count: 0, status: 'new', last_reviewed_at: null, interval_days: 0 })
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error resetting progress (Supabase): " + error.message);
        console.error("Error resetting progress (Supabase):", error);
      } else {
        setCards(prevCards => prevCards.map(card => ({ ...card, seen_count: 0, status: 'new', last_reviewed_at: null, interval_days: 0 })));
        setCurrentCardIndex(0);
        setIsFlipped(false);
        toast.success("All card progress reset!");
      }
    } else {
      // Guest mode: reset local storage progress
      setCards(prevCards => {
        const updated = prevCards.map(card => ({ ...card, seen_count: 0, status: 'new', last_reviewed_at: null, interval_days: 0 }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      setCurrentCardIndex(0);
      setIsFlipped(false);
      toast.success("All card progress reset (locally)!");
    }
  };

  if (loading) {
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
      <div className="flex flex-col flex-1 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Flash Cards</h1>
        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={70} minSize={40}>
            <div className="flex flex-col items-center justify-center h-full p-4">
              <FlashCardDeck
                cards={filteredCards}
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
                filterMode={filterMode}
                setFilterMode={setFilterMode}
                onResetProgress={handleResetProgress}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full p-4">
              <FlashCardListSidebar
                cards={filteredCards}
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