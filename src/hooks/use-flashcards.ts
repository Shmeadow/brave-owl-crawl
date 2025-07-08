"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { useCurrentRoom } from '@/hooks/use-current-room';
import { toast } from 'sonner';

export interface CardData {
  id: string;
  front: string;
  back: string;
  category_id: string | null;
  created_at: string;
  user_id: string;
  room_id: string | null;
  status: 'Learning' | 'Reviewing' | 'Mastered';
  last_reviewed_at: string | null;
  ease_factor: number;
  interval_days: number;
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
  room_id: string | null;
}

export const useFlashcards = () => {
  const { supabase, session } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [cards, setCards] = useState<CardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlashcards = useCallback(async () => {
    if (!supabase || !session) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('room_id', currentRoomId);

    if (error) {
      toast.error('Failed to fetch flashcards: ' + error.message);
      console.error("Error fetching flashcards:", error);
    } else {
      setCards(data || []);
    }
  }, [supabase, session, currentRoomId]);

  const fetchCategories = useCallback(async () => {
    if (!supabase || !session) return;
    
    const { data, error } = await supabase
      .from('flashcard_categories')
      .select('*')
      .eq('room_id', currentRoomId);

    if (error) {
      toast.error('Failed to fetch categories: ' + error.message);
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
  }, [supabase, session, currentRoomId]);

  useEffect(() => {
    if (session && currentRoomId) {
      Promise.all([fetchFlashcards(), fetchCategories()]).finally(() => setLoading(false));
    } else if (!session) {
      setLoading(false);
      setCards([]);
      setCategories([]);
    }
  }, [session, currentRoomId, fetchFlashcards, fetchCategories]);

  const handleAddCard = async (newCardData: { front: string; back: string; category_id?: string | null }) => {
    if (!supabase || !session) return;
    const { data, error } = await supabase
      .from('flashcards')
      .insert({ ...newCardData, user_id: session.user.id, room_id: currentRoomId })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to add flashcard: ' + error.message);
    } else if (data) {
      setCards(prev => [...prev, data]);
      toast.success('Flashcard added successfully!');
    }
  };

  const handleUpdateCard = async (updatedCardData: { id?: string; front: string; back: string; category_id?: string | null }) => {
    if (!supabase || !session || !updatedCardData.id) return;
    const { data, error } = await supabase
      .from('flashcards')
      .update({ front: updatedCardData.front, back: updatedCardData.back, category_id: updatedCardData.category_id })
      .eq('id', updatedCardData.id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update flashcard: ' + error.message);
    } else if (data) {
      setCards(prev => prev.map(c => c.id === data.id ? data : c));
      toast.success('Flashcard updated successfully!');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!supabase || !session) return;
    const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
    if (error) {
      toast.error('Failed to delete flashcard: ' + error.message);
    } else {
      setCards(prev => prev.filter(c => c.id !== cardId));
      toast.success('Flashcard deleted.');
    }
  };

  const handleDeleteMultipleCards = async (cardIds: string[]) => {
    if (!supabase || !session) return;
    const { error } = await supabase.from('flashcards').delete().in('id', cardIds);
    if (error) {
      toast.error('Failed to delete flashcards: ' + error.message);
    } else {
      setCards(prev => prev.filter(c => !cardIds.includes(c.id)));
      toast.success(`${cardIds.length} flashcards deleted.`);
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!supabase || !session) return;
    const { data, error } = await supabase
      .from('flashcard_categories')
      .insert({ name, user_id: session.user.id, room_id: currentRoomId })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to add category: ' + error.message);
    } else if (data) {
      setCategories(prev => [...prev, data]);
      toast.success('Category added!');
      return data;
    }
    return null;
  };

  const handleUpdateCardCategory = async (cardId: string, newCategoryId: string | null) => {
    if (!supabase || !session) return;
    const { data, error } = await supabase
      .from('flashcards')
      .update({ category_id: newCategoryId })
      .eq('id', cardId)
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to update category: ' + error.message);
    } else if (data) {
      setCards(prev => prev.map(c => c.id === data.id ? data : c));
      toast.success('Flashcard category updated.');
    }
  };

  return {
    cards,
    categories,
    loading,
    fetchFlashcards,
    fetchCategories,
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleDeleteMultipleCards,
    handleAddCategory,
    handleUpdateCardCategory,
  };
};