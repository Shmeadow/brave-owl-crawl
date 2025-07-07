"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { Category } from './types';
import { usePersistentData } from '../use-persistent-data'; // Import the new hook

interface DbCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_flashcard_categories';
const SUPABASE_TABLE_NAME = 'flashcard_categories';

export function useFlashcardCategories() {
  const { supabase, session } = useSupabase();

  const {
    data: categories,
    loading,
    isLoggedInMode,
    setData: setCategories,
    fetchData,
  } = usePersistentData<Category[], DbCategory>({ // T_APP_DATA is Category[], T_DB_DATA_ITEM is DbCategory
    localStorageKey: LOCAL_STORAGE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: [],
    selectQuery: '*',
    transformFromDb: (dbCategories: DbCategory[]) => dbCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      user_id: cat.user_id,
      created_at: cat.created_at,
    })),
    transformToDb: (appCategory: Category, userId: string) => ({ // appItem is Category, returns DbCategory
      id: appCategory.id,
      name: appCategory.name,
      user_id: userId,
      created_at: appCategory.created_at,
    }),
    userIdColumn: 'user_id',
    onConflictColumn: 'id',
    debounceDelay: 0,
  });

  const addCategory = async (name: string): Promise<Category | null> => {
    if (!session || !supabase) {
      toast.error('You must be logged in to add a category.');
      return null;
    }
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .insert({ name, user_id: session.user.id })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to add category: ' + error.message);
      return null;
    }
    if (data) {
      fetchData(); // Re-fetch to update state
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
      .from(SUPABASE_TABLE_NAME)
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update category: ' + error.message);
    } else if (data) {
      fetchData(); // Re-fetch to update state
      toast.success(`Category renamed to "${name}".`);
    }
  };

  const deleteCategory = async (id: string, deleteContents: boolean): Promise<boolean> => {
    if (!session || !supabase) {
      toast.error('You must be logged in to delete a category.');
      return false;
    }

    if (deleteContents) {
      const { error: deleteCardsError } = await supabase
        .from('flashcards')
        .delete()
        .eq('category_id', id);

      if (deleteCardsError) {
        toast.error('Failed to delete flashcards in category: ' + deleteCardsError.message);
        return false;
      }
    } else {
      const { error: unlinkError } = await supabase
        .from('flashcards')
        .update({ category_id: null })
        .eq('category_id', id);

      if (unlinkError) {
        toast.error('Failed to unlink cards from category: ' + unlinkError.message);
        return false;
      }
    }

    const { error } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete category: ' + error.message);
      return false;
    } else {
      fetchData(); // Re-fetch to update state
      toast.success('Category and its contents handled successfully.');
      return true;
    }
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory, fetchCategories: fetchData };
}