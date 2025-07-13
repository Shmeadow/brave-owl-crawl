"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface NoteData {
  id: string;
  user_id?: string; // Optional for local storage notes
  title: string | null;
  content: string;
  starred: boolean;
  created_at: string;
  type: 'note' | 'journal'; // New: Type of note
}

const LOCAL_STORAGE_KEY = 'guest_notes';

export function useNotes() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadNotes = async () => {
      setLoading(true);
      if (session && supabase) {
        // User is logged in
        setIsLoggedInMode(true);
        
        const localNotesString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localNotes: NoteData[] = [];
        try {
          localNotes = localNotesString ? JSON.parse(localNotesString) : [];
        } catch (e) {
          console.error("Error parsing local storage notes:", e);
          localNotes = [];
        }

        const { data: supabaseNotes, error: fetchError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (fetchError) {
          toast.error("Error fetching notes from Supabase: " + fetchError.message);
          console.error("Error fetching notes (Supabase):", fetchError);
          setNotes([]);
        } else {
          let mergedNotes = [...(supabaseNotes as NoteData[])];

          if (localNotes.length > 0) {
            for (const localNote of localNotes) {
              const existsInSupabase = mergedNotes.some(
                sn => sn.content === localNote.content
              );

              if (!existsInSupabase) {
                const { data: newSupabaseNote, error: insertError } = await supabase
                  .from('notes')
                  .insert({
                    user_id: session.user.id,
                    title: localNote.title,
                    content: localNote.content,
                    starred: localNote.starred,
                    created_at: localNote.created_at || new Date().toISOString(),
                    type: localNote.type || 'note', // Ensure type is set during migration
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error migrating local note to Supabase:", insertError);
                  toast.error("Error migrating some local notes.");
                } else if (newSupabaseNote) {
                  mergedNotes.push(newSupabaseNote as NoteData);
                }
              }
            }
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            toast.success("Local notes migrated to your account!");
          }
          setNotes(mergedNotes);
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const storedNotesString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let loadedNotes: NoteData[] = [];
        try {
          loadedNotes = storedNotesString ? JSON.parse(storedNotesString) : [];
        } catch (e) {
          console.error("Error parsing local storage notes:", e);
          loadedNotes = [];
        }
        // Ensure all loaded notes have a 'type' property, default to 'note' if missing
        loadedNotes = loadedNotes.map(note => ({ ...note, type: note.type || 'note' }));
        setNotes(loadedNotes);
        if (loadedNotes.length === 0) {
          toast.info("You are browsing notes as a guest. Your notes will be saved locally.");
        }
      }
      setLoading(false);
    };

    loadNotes();
  }, [session, supabase, authLoading]);

  // Effect to save notes to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoggedInMode, loading]);

  const handleAddNote = useCallback(async ({ title, content, type }: { title: string; content: string; type: 'note' | 'journal' }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: session.user.id,
          title,
          content,
          starred: false,
          type, // Include type here
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding note (Supabase): " + error.message);
        console.error("Error adding note (Supabase):", error);
      } else if (data) {
        setNotes((prevNotes) => [...prevNotes, data as NoteData]);
        toast.success("Note added successfully to your account!");
      }
    } else {
      const newNote: NoteData = {
        id: crypto.randomUUID(),
        title,
        content,
        starred: false,
        created_at: new Date().toISOString(),
        type, // Include type here
      };
      setNotes((prevNotes) => [...prevNotes, newNote]);
      toast.success("Note added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error deleting note (Supabase): " + error.message);
        console.error("Error deleting note (Supabase):", error);
      } else {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
        toast.success("Note deleted from your account.");
      }
    } else {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      toast.success("Note deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleToggleStar = useCallback(async (noteId: string) => {
    const noteToUpdate = notes.find(note => note.id === noteId);
    if (!noteToUpdate) return;

    const newStarredStatus = !noteToUpdate.starred;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .update({ starred: newStarredStatus })
        .eq('id', noteId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating star status (Supabase): " + error.message);
        console.error("Error updating star status (Supabase):", error);
      } else if (data) {
        setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? data as NoteData : note));
        toast.info(newStarredStatus ? "Note starred!" : "Note unstarred.");
      }
    } else {
      setNotes(prevNotes => prevNotes.map(note =>
        note.id === noteId ? { ...note, starred: newStarredStatus } : note
      ));
      toast.info(newStarredStatus ? "Note starred (locally)!" : "Note unstarred (locally).");
    }
  }, [notes, isLoggedInMode, session, supabase]);

  const handleUpdateNoteContent = useCallback(async (noteId: string, newContent: string) => {
    const noteToUpdate = notes.find(note => note.id === noteId);
    if (!noteToUpdate) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .update({ content: newContent })
        .eq('id', noteId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating note content (Supabase): " + error.message);
        console.error("Error updating note content (Supabase):", error);
      } else if (data) {
        setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? data as NoteData : note));
        // toast.success("Note content updated!"); // Too frequent, removed
      }
    } else {
      setNotes(prevNotes => prevNotes.map(note =>
        note.id === noteId ? { ...note, content: newContent } : note
      ));
      // toast.success("Note content updated (locally)!"); // Too frequent, removed
    }
  }, [notes, isLoggedInMode, session, supabase]);

  const handleUpdateNoteTitle = useCallback(async (noteId: string, newTitle: string) => {
    const noteToUpdate = notes.find(note => note.id === noteId);
    if (!noteToUpdate) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .update({ title: newTitle })
        .eq('id', noteId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating note title (Supabase): " + error.message);
        console.error("Error updating note title (Supabase):", error);
      } else if (data) {
        setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? data as NoteData : note));
        toast.success("Note title updated!");
      }
    } else {
      setNotes(prevNotes => prevNotes.map(note =>
        note.id === noteId ? { ...note, title: newTitle } : note
      ));
      toast.success("Note title updated (locally)!");
    }
  }, [notes, isLoggedInMode, session, supabase]);

  return {
    notes,
    loading,
    isLoggedInMode,
    handleAddNote,
    handleDeleteNote,
    handleToggleStar,
    handleUpdateNoteContent,
    handleUpdateNoteTitle,
  };
}