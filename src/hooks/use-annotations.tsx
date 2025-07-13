"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface AnnotationData {
  id: string;
  note_id: string;
  user_id: string;
  highlight_id: string; // Unique ID for the highlight within the note's content
  highlighted_text: string | null;
  comment: string | null;
  created_at: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'guest_annotations_'; // Prefix for local storage keys

export function useAnnotations(noteId: string | null) {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchAnnotations = useCallback(async () => {
    if (authLoading || !noteId) {
      setAnnotations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      // Attempt to migrate local annotations for this specific note first
      const localStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${noteId}`;
      const localAnnotationsString = localStorage.getItem(localStorageKey);
      let localAnnotations: AnnotationData[] = [];
      try {
        localAnnotations = localAnnotationsString ? JSON.parse(localAnnotationsString) : [];
      } catch (e) {
        console.error("Error parsing local storage annotations:", e);
        localAnnotations = [];
      }

      const { data: supabaseAnnotations, error: fetchError } = await supabase
        .from('annotations')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        toast.error("Error fetching annotations from Supabase: " + fetchError.message);
        console.error("Error fetching annotations (Supabase):", fetchError);
        setAnnotations([]);
      } else {
        let mergedAnnotations = [...(supabaseAnnotations as AnnotationData[])];

        if (localAnnotations.length > 0) {
          for (const localAnnotation of localAnnotations) {
            const existsInSupabase = mergedAnnotations.some(
              sa => sa.highlight_id === localAnnotation.highlight_id
            );
            if (!existsInSupabase) {
              const { data: newSupabaseAnnotation, error: insertError } = await supabase
                .from('annotations')
                .insert({
                  note_id: noteId,
                  user_id: session.user.id,
                  highlight_id: localAnnotation.highlight_id,
                  highlighted_text: localAnnotation.highlighted_text,
                  comment: localAnnotation.comment,
                  created_at: localAnnotation.created_at || new Date().toISOString(),
                })
                .select()
                .single();
              if (insertError) {
                console.error("Error migrating local annotation to Supabase:", insertError);
                toast.error("Error migrating some local annotations.");
              } else if (newSupabaseAnnotation) {
                mergedAnnotations.push(newSupabaseAnnotation as AnnotationData);
              }
            }
          }
          localStorage.removeItem(localStorageKey); // Clear local storage after migration
          toast.success("Local annotations migrated!");
        }
        setAnnotations(mergedAnnotations);
      }
    } else {
      // User is a guest (not logged in)
      setIsLoggedInMode(false);
      const localStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${noteId}`;
      const storedAnnotationsString = localStorage.getItem(localStorageKey);
      let loadedAnnotations: AnnotationData[] = [];
      try {
        loadedAnnotations = storedAnnotationsString ? JSON.parse(storedAnnotationsString) : [];
      } catch (e) {
        console.error("Error parsing local storage annotations:", e);
        loadedAnnotations = [];
      }
      setAnnotations(loadedAnnotations);
    }
    setLoading(false);
  }, [session, supabase, authLoading, noteId]);

  useEffect(() => {
    if (!authLoading && noteId) {
      fetchAnnotations();
    }
  }, [authLoading, noteId, fetchAnnotations]);

  // Effect to save annotations to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading && noteId) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${noteId}`, JSON.stringify(annotations));
    }
  }, [annotations, isLoggedInMode, loading, noteId]);

  const addAnnotation = useCallback(async (newAnnotation: Omit<AnnotationData, 'id' | 'user_id' | 'created_at'>) => {
    if (!noteId) {
      toast.error("Cannot add annotation: No note selected.");
      return null;
    }
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('annotations')
        .insert({
          ...newAnnotation,
          note_id: noteId,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding annotation (Supabase): " + error.message);
        console.error("Error adding annotation (Supabase):", error);
        return null;
      } else if (data) {
        setAnnotations((prev) => [...prev, data as AnnotationData]);
        toast.success("Annotation added!");
        return data as AnnotationData;
      }
    } else {
      const newLocalAnnotation: AnnotationData = {
        id: crypto.randomUUID(),
        user_id: 'guest', // Placeholder for guest mode
        created_at: new Date().toISOString(),
        ...newAnnotation,
        note_id: noteId,
      };
      setAnnotations((prev) => [...prev, newLocalAnnotation]);
      toast.success("Annotation added (locally)!");
      return newLocalAnnotation;
    }
    return null;
  }, [isLoggedInMode, session, supabase, noteId]);

  const updateAnnotation = useCallback(async (annotationId: string, updatedFields: Partial<Omit<AnnotationData, 'id' | 'note_id' | 'user_id' | 'created_at'>>) => {
    const annotationToUpdate = annotations.find(a => a.id === annotationId);
    if (!annotationToUpdate) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('annotations')
        .update(updatedFields)
        .eq('id', annotationId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating annotation (Supabase): " + error.message);
        console.error("Error updating annotation (Supabase):", error);
      } else if (data) {
        setAnnotations((prev) => prev.map(a => a.id === annotationId ? data as AnnotationData : a));
        toast.success("Annotation updated!");
      }
    } else {
      setAnnotations((prev) => prev.map(a => a.id === annotationId ? { ...a, ...updatedFields } : a));
      toast.success("Annotation updated (locally)!");
    }
  }, [annotations, isLoggedInMode, session, supabase]);

  const deleteAnnotation = useCallback(async (annotationId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('annotations')
        .delete()
        .eq('id', annotationId)
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error deleting annotation (Supabase): " + error.message);
        console.error("Error deleting annotation (Supabase):", error);
      } else {
        setAnnotations((prev) => prev.filter(a => a.id !== annotationId));
        toast.success("Annotation deleted.");
      }
    } else {
      setAnnotations((prev) => prev.filter(a => a.id !== annotationId));
      toast.success("Annotation deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  return {
    annotations,
    loading,
    isLoggedInMode,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    fetchAnnotations,
  };
}