"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "./use-current-room";

export interface NoteData {
  id: string;
  user_id?: string;
  room_id: string | null;
  title: string | null;
  content: string;
  starred: boolean;
  created_at: string;
  type: 'note' | 'journal';
}

const LOCAL_STORAGE_KEY = 'guest_notes';

export function useNotes() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      const localNotesString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localNotes: NoteData[] = [];
      try {
        localNotes = localNotesString ? JSON.parse(localNotesString) : [];
      } catch (e) {
        console.error("Error parsing local storage notes:", e);
      }

      const query = supabase
        .from('notes')
        .select('*')
        .eq('type', 'note');
      
      if (currentRoomId) {
        query.eq('room_id', currentRoomId);
      } else {
        query.is('room_id', null).eq('user_id', session.user.id);
      }

      const { data: supabaseNotes, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) {
        toast.error("Error fetching notes: " + fetchError.message);
        setNotes([]);
      } else {
        let mergedNotes = [...(supabaseNotes as NoteData[])];
        if (localNotes.length > 0 && !currentRoomId) {
          for (const localNote of localNotes.filter(n => n.type === 'note')) {
            const existsInSupabase = mergedNotes.some(sn => sn.content === localNote.content && sn.created_at === localNote.created_at);
            if (!existsInSupabase) {
              const { data: newSupabaseNote, error: insertError } = await supabase
                .from('notes')
                .insert({
                  user_id: session.user.id,
                  room_id: null,
                  title: localNote.title,
                  content: localNote.content,
                  starred: localNote.starred,
                  created_at: localNote.created_at || new Date().toISOString(),
                  type: 'note',
                })
                .select()
                .single();
              if (insertError) {
                console.error("Error migrating local note:", insertError);
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
      setIsLoggedInMode(false);
      const storedNotesString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedNotes: NoteData[] = [];
      try {
        loadedNotes = storedNotesString ? JSON.parse(storedNotesString) : [];
      } catch (e) {
        console.error("Error parsing local storage notes:", e);
      }
      setNotes(loadedNotes.filter(note => note.type === 'note' || !note.type));
      if (loadedNotes.length === 0 && !currentRoomId) {
        toast.info("You are browsing notes as a guest. Your notes will be saved locally.");
      }
    }
    setLoading(false);
  }, [session, supabase, authLoading, currentRoomId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoggedInMode, loading]);

  useEffect(() => {
    if (!currentRoomId || !supabase) return;
    const channel = supabase.channel(`room-notes-${currentRoomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `room_id=eq.${currentRoomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as NoteData;
            setNotes(prev => [newNote, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNote = payload.new as NoteData;
            setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
          } else if (payload.eventType === 'DELETE') {
            const deletedNoteId = (payload.old as any).id;
            setNotes(prev => prev.filter(n => n.id !== deletedNoteId));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRoomId, supabase]);

  const handleAddNote = useCallback(async ({ title, content }: { title: string; content: string; }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: session.user.id,
          room_id: currentRoomId,
          title,
          content,
          starred: false,
          type: 'note',
        })
        .select()
        .single();
      if (error) {
        toast.error("Error adding note: " + error.message);
      } else if (data) {
        // No need to setNotes here, realtime will handle it
        toast.success("Note added successfully!");
      }
    } else {
      if (currentRoomId) {
        toast.error("You must be logged in to add notes to a room.");
        return;
      }
      const newNote: NoteData = {
        id: crypto.randomUUID(),
        room_id: null,
        title,
        content,
        starred: false,
        created_at: new Date().toISOString(),
        type: 'note',
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
        .eq('id', noteId);
      if (error) {
        toast.error("Error deleting note: " + error.message);
      } else {
        // Realtime will handle UI update
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
      const { error } = await supabase
        .from('notes')
        .update({ starred: newStarredStatus })
        .eq('id', noteId);
      if (error) {
        toast.error("Error updating star status: " + error.message);
      } else {
        // Realtime will handle UI update
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
      const { error } = await supabase
        .from('notes')
        .update({ content: newContent })
        .eq('id', noteId);
      if (error) {
        toast.error("Error updating note content: " + error.message);
      }
    } else {
      setNotes(prevNotes => prevNotes.map(note =>
        note.id === noteId ? { ...note, content: newContent } : note
      ));
    }
  }, [notes, isLoggedInMode, session, supabase]);

  const handleUpdateNoteTitle = useCallback(async (noteId: string, newTitle: string) => {
    const noteToUpdate = notes.find(note => note.id === noteId);
    if (!noteToUpdate) return;
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('notes')
        .update({ title: newTitle })
        .eq('id', noteId);
      if (error) {
        toast.error("Error updating note title: " + error.message);
      } else {
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