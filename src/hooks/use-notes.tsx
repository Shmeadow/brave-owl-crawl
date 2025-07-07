"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { usePersistentData } from "./use-persistent-data"; // Import the new hook

export interface NoteData {
  id: string;
  user_id?: string; // Optional for local storage notes
  content: string;
  starred: boolean;
  created_at: string;
}

interface DbNote {
  id: string;
  user_id: string;
  content: string;
  starred: boolean;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_notes';
const SUPABASE_TABLE_NAME = 'notes';

export function useNotes() {
  const { supabase, session } = useSupabase();

  const {
    data: notes,
    loading,
    isLoggedInMode,
    setData: setNotes, // Rename setData to setNotes for clarity
    fetchData, // Expose fetchData for manual refresh after mutations
  } = usePersistentData<NoteData[], DbNote>({ // T_APP_DATA is NoteData[], T_DB_DATA_ITEM is DbNote
    localStorageKey: LOCAL_STORAGE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: [],
    selectQuery: '*',
    transformFromDb: (dbNotes: DbNote[]) => dbNotes.map(note => ({
      id: note.id,
      user_id: note.user_id,
      content: note.content,
      starred: note.starred,
      created_at: note.created_at,
    })),
    transformToDb: (appNote: NoteData, userId: string) => ({ // appItem is NoteData, returns DbNote
      id: appNote.id, // Keep ID for upserting during migration
      user_id: userId,
      content: appNote.content,
      starred: appNote.starred,
      created_at: appNote.created_at,
    }),
    userIdColumn: 'user_id',
    onConflictColumn: 'id', // For migrating existing local notes
    debounceDelay: 0, // No debouncing for list mutations, rely on explicit fetchData
  });

  const handleAddNote = useCallback(async (content: string) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .insert({
          user_id: session.user.id,
          content: content,
          starred: false,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding note (Supabase): " + error.message);
        console.error("Error adding note (Supabase):", error);
      } else if (data) {
        fetchData(); // Re-fetch to update the state with the new note
        toast.success("Note added successfully to your account!");
      }
    } else {
      const newNote: NoteData = {
        id: crypto.randomUUID(),
        content: content,
        starred: false,
        created_at: new Date().toISOString(),
      };
      setNotes((prevNotes) => [...prevNotes, newNote]);
      toast.success("Note added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase, setNotes, fetchData]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .delete()
        .eq('id', noteId)
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error deleting note (Supabase): " + error.message);
        console.error("Error deleting note (Supabase):", error);
      } else {
        fetchData(); // Re-fetch to update the state
        toast.success("Note deleted from your account.");
      }
    } else {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      toast.success("Note deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase, setNotes, fetchData]);

  const handleToggleStar = useCallback(async (noteId: string) => {
    const noteToUpdate = notes.find(note => note.id === noteId);
    if (!noteToUpdate) return;

    const newStarredStatus = !noteToUpdate.starred;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .update({ starred: newStarredStatus })
        .eq('id', noteId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating star status (Supabase): " + error.message);
        console.error("Error updating star status (Supabase):", error);
      } else if (data) {
        fetchData(); // Re-fetch to update the state
        toast.info(newStarredStatus ? "Note starred!" : "Note unstarred.");
      }
    } else {
      setNotes(prevNotes => prevNotes.map(note =>
        note.id === noteId ? { ...note, starred: newStarredStatus } : note
      ));
      toast.info(newStarredStatus ? "Note starred (locally)!" : "Note unstarred (locally).");
    }
  }, [notes, isLoggedInMode, session, supabase, setNotes, fetchData]);

  return {
    notes,
    loading,
    isLoggedInMode,
    handleAddNote,
    handleDeleteNote,
    handleToggleStar,
  };
}