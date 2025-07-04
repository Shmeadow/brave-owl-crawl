"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "./use-current-room"; // Import useCurrentRoom

export interface NoteData {
  id: string;
  user_id: string; // Now always present for Supabase, or local for guest
  room_id: string | null; // New: Can be null for personal notes
  content: string;
  starred: boolean;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_notes';

export function useNotes() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId, currentRoomCreatorId } = useCurrentRoom(); // Get current room ID and creator
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadNotes = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        
        let fetchedNotes: NoteData[] = [];
        if (currentRoomId) {
          // Fetch notes for the current room
          const { data: roomNotes, error: fetchError } = await supabase
            .from('notes')
            .select('*')
            .eq('room_id', currentRoomId)
            .order('created_at', { ascending: true });

          if (fetchError) {
            toast.error("Error fetching notes for room: " + fetchError.message);
            console.error("Error fetching notes (Supabase, room):", fetchError);
          } else {
            fetchedNotes = roomNotes as NoteData[];
          }
        } else {
          // Fetch personal notes (room_id is NULL)
          const { data: personalNotes, error: fetchError } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', session.user.id)
            .is('room_id', null)
            .order('created_at', { ascending: true });

          if (fetchError) {
            toast.error("Error fetching personal notes: " + fetchError.message);
            console.error("Error fetching notes (Supabase, personal):", fetchError);
          } else {
            fetchedNotes = personalNotes as NoteData[];
          }

          // Attempt to migrate local notes to personal notes if they exist
          const localNotesString = localStorage.getItem(LOCAL_STORAGE_KEY);
          let localNotes: NoteData[] = [];
          try {
            localNotes = localNotesString ? JSON.parse(localNotesString) : [];
          } catch (e) {
            console.error("Error parsing local storage notes:", e);
            localNotes = [];
          }

          if (localNotes.length > 0) {
            console.log(`Found ${localNotes.length} local notes. Attempting migration...`);
            const toInsert = localNotes.filter(localNote => 
              !fetchedNotes.some(sn => sn.content === localNote.content) // Avoid duplicates
            ).map(localNote => ({
              user_id: session.user.id,
              room_id: null, // Migrate as personal notes
              content: localNote.content,
              starred: localNote.starred,
              created_at: localNote.created_at || new Date().toISOString(),
            }));

            if (toInsert.length > 0) {
              const { data: newSupabaseNotes, error: insertError } = await supabase
                .from('notes')
                .insert(toInsert)
                .select();

              if (insertError) {
                console.error("Error migrating local notes to Supabase:", insertError);
                toast.error("Error migrating some local notes.");
              } else if (newSupabaseNotes) {
                fetchedNotes = [...fetchedNotes, ...newSupabaseNotes as NoteData[]];
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                toast.success("Local notes migrated to your account!");
              }
            } else {
              localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear if all already exist
            }
          }
        }
        setNotes(fetchedNotes);
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
        setNotes(loadedNotes);
        if (loadedNotes.length === 0) {
          toast.info("You are browsing notes as a guest. Your notes will be saved locally.");
        }
      }
      setLoading(false);
    };

    loadNotes();
  }, [session, supabase, authLoading, currentRoomId]); // Depend on currentRoomId

  // Effect to save notes to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoggedInMode, loading]);

  const handleAddNote = useCallback(async (content: string) => {
    if (!session?.user?.id && isLoggedInMode) {
      toast.error("You must be logged in to add a note.");
      return;
    }

    if (isLoggedInMode && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: session!.user.id,
          room_id: currentRoomId, // Use current room ID
          content: content,
          starred: false,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding note: " + error.message);
        console.error("Error adding note (Supabase):", error);
      } else if (data) {
        setNotes((prevNotes) => [...prevNotes, data as NoteData]);
        toast.success("Note added successfully!");
      }
    } else {
      const newNote: NoteData = {
        id: crypto.randomUUID(),
        user_id: 'guest', // Placeholder for guest mode
        room_id: null,
        content: content,
        starred: false,
        created_at: new Date().toISOString(),
      };
      setNotes((prevNotes) => [...prevNotes, newNote]);
      toast.success("Note added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', session.user.id); // Ensure user owns the note

      if (error) {
        toast.error("Error deleting note: " + error.message);
        console.error("Error deleting note (Supabase):", error);
      } else {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
        toast.success("Note deleted.");
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
        .eq('user_id', session.user.id); // Ensure user owns the note

      if (error) {
        toast.error("Error updating star status: " + error.message);
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

  return {
    notes,
    loading,
    isLoggedInMode,
    handleAddNote,
    handleDeleteNote,
    handleToggleStar,
  };
}