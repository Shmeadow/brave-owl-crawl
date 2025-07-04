"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { Category } from './types';
import { useCurrentRoom } from '../use-current-room'; // Import useCurrentRoom

export function useFlashcardCategories() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom(); // Get current room ID
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (authLoading) {
      setLoading(false);
      return;
    }
    if (!session || !supabase) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    
    let fetchedCategories: Category[] = [];
    if (currentRoomId) {
      // Fetch categories for the current room
      const { data, error } = await supabase
        .from('flashcard_categories')
        .select('*')
        .eq('room_id', currentRoomId)
        .eq('user_id', session.user.id) // Only fetch user's categories for this room
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to load categories for room: ' + error.message);
        console.error("Error fetching categories (Supabase, room):", error);
      } else {
        fetchedCategories = data as Category[];
      }
    } else {
      // Fetch personal categories (room_id is NULL)
      const { data, error } = await supabase
        .from('flashcard_categories')
        .select('*')
        .eq('user_id', session.user.id)
        .is('room_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to load personal categories: ' + error.message);
        console.error("Error fetching categories (Supabase, personal):", error);
      } else {
        fetchedCategories = data as Category[];
      }
    }
    setCategories(fetchedCategories);
    setLoading(false);
  }, [session, supabase, authLoading, currentRoomId]); // Depend on currentRoomId

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string): Promise<Category | null> => {
    if (!session || !supabase) {
      toast.error('You must be logged in to add a category.');
      return null;
    }
    const { data, error } = await supabase
      .from('flashcard_categories')
      .insert({ name, user_id: session.user.id, room_id: currentRoomId }) // Use current room ID
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to add category: ' + error.message);
      return null;
    }
    if (data) {
      setCategories(prev => [...prev, data as Category]);
      toast.success(`Category "${name}" created.`);
      return data as Category;
    }
    return null;
  };

  const updateCategory = async (id: string, name: string) => {
    if (!session || !supabase) {
      toast.error('You must be logged in to update a category.');
      return;
    }
    const { data, error } = await supabase
      .from('flashcard_categories')
      .update({ name })
      .eq('id', id)
      .eq('user_id', session.user.id) // Ensure user owns the category
      .select()
      .single();

    if (error) {
      toast.error('Failed to update category: ' + error.message);
    } else if (data) {
      setCategories(prev => prev.map(c => c.id === id ? data as Category : c));
      toast.success(`Category renamed to "${name}".`);
    }
  };

  const deleteCategory = async (id: string, deleteContents: boolean): Promise<boolean> => {
    if (!session || !supabase) {
      toast.error('You must be logged in to delete a category.');
      return false;
    }

    if (deleteContents) {
      // Delete all flashcards within the category first
      const { error: deleteCardsError } = await supabase
        .from('flashcards')
        .delete()
        .eq('category_id', id)
        .eq('user_id', session.user.id); // Ensure user owns the cards

      if (deleteCardsError) {
        toast.error('Failed to delete flashcards in category: ' + deleteCardsError.message);
        return false;
      }
    } else {
      // Unlink all cards from this category
      const { error: unlinkError } = await supabase
        .from('flashcards')
        .update({ category_id: null })
        .eq('category_id', id)
        .eq('user_id', session.user.id); // Ensure user owns the cards

      if (unlinkError) {
        toast.error('Failed to unlink cards from category: ' + unlinkError.message);
        return false;
      }
    }

    // Now, delete the category itself
    const { error } = await supabase
      .from('flashcard_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id); // Ensure user owns the category

    if (error) {
      toast.error('Failed to delete category: ' + error.message);
      return false;
    } else {
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category and its contents handled successfully.');
      return true;
    }
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory, fetchCategories };
}