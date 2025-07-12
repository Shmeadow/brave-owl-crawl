"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "./use-current-room";

export interface NoteData {
  id: string;
  user_id?: string;
  room_id: string | null;
  content: string;
  starred: boolean;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_notes';

export function useNotes() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (session) {
        setIsLoggedInMode(true);
        let query = supabase
          .from('notes')
          .select('*')
          .eq('user_id', session.user.id);

        if (currentRoomId) {
          query = query.eq('room_id', currentRoomId);
        } else {
          query = query.is('room_id', null);
        }
        
        const { data, error } = await query.order('created_at', { ascending: true });
        if (error) throw error;
        setNotes(data as NoteData[]);
      } else {
        setIsLoggedInMode(false);
        const storedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
        setNotes(storedNotes ? JSON.parse(storedNotes) : []);
      }
    } catch (error: any) {
      toast.error("Failed to load notes: " + error.message);
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  }, [session, supabase, currentRoomId]);

  useEffect(() => {
    if (!authLoading) {
      fetchNotes();
    }
  }, [authLoading, fetchNotes]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoggedInMode, loading]);

  const handleAddNote = useCallback(async (content: string) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .insert({ user_id: session.user.id, room_id: currentRoomId, content, starred: false })
        .select()
        .single();
      if (error) toast.error("Error adding note: " + error.message);
      else if (data) setNotes(prev => [...prev, data as NoteData]);
    } else {
      const newNote: NoteData = { id: crypto.randomUUID(), room_id: null, content, starred: false, created_at: new Date().toISOString() };
      setNotes(prev => [...prev, newNote]);
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) toast.error("Error deleting note: " + error.message);
      else setNotes(prev => prev.filter(n => n.id !== noteId));
    } else {
      setNotes(prev => prev.filter(n => n.id !== noteId));
    }
  }, [isLoggedInMode, session, supabase]);

  const handleToggleStar = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const newStarredStatus = !note.starred;
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .update({ starred: newStarredStatus })
        .eq('id', noteId)
        .select()
        .single();
      if (error) toast.error("Error updating note: " + error.message);
      else if (data) setNotes(prev => prev.map(n => n.id === noteId ? data as NoteData : n));
    } else {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, starred: newStarredStatus } : n));
    }
  }, [notes, isLoggedInMode, session, supabase]);

  return { notes, loading, isLoggedInMode, handleAddNote, handleDeleteNote, handleToggleStar };
}