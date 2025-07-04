"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { Category } from './types';

export function useFlashcardCategories() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!session || !supabase) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('flashcard_categories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load categories: ' + error.message);
      setCategories([]);
    } else {
      setCategories(data as Category[]);
    }
    setLoading(false);
  }, [session, supabase]);

  useEffect(() => {
    if (!authLoading) {
      fetchCategories();
    }
  }, [authLoading, fetchCategories]);

  const addCategory = async (name: string): Promise<Category | null> => {
    if (!session || !supabase) {
      toast.error('You must be logged in to add a category.');
      return null;
    }
    const { data, error } = await supabase
      .from('flashcard_categories')
      .insert({ name, user_id: session.user.id })
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
      .select()
      .single();

    if (error) {
      toast.error('Failed to update category: ' + error.message);
    } else if (data) {
      setCategories(prev => prev.map(c => c.id === id ? data as Category : c));
      toast.success(`Category renamed to "${name}".`);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!session || !supabase) {
      toast.error('You must be logged in to delete a category.');
      return;
    }
    const { error } = await supabase
      .from('flashcard_categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete category: ' + error.message);
    } else {
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted.');
    }
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory, fetchCategories };
}