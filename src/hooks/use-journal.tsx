"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

// Reusing NoteData interface as journal entries share the same table structure
export interface JournalEntryData {
  id: string;
  user_id?: string; // Optional for local storage entries
  title: string | null;
  content: string;
  starred: boolean;
  created_at: string;
  type: 'note' | 'journal'; // Will always be 'journal' for this hook
}

const LOCAL_STORAGE_KEY = 'guest_journal_entries';

export function useJournal() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [journalEntries, setJournalEntries] = useState<JournalEntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadJournalEntries = async () => {
      setLoading(true);
      if (session && supabase) {
        // User is logged in
        setIsLoggedInMode(true);
        
        const localEntriesString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localEntries: JournalEntryData[] = [];
        try {
          localEntries = localEntriesString ? JSON.parse(localEntriesString) : [];
        } catch (e) {
          console.error("Error parsing local storage journal entries:", e);
          localEntries = [];
        }

        const { data: supabaseEntries, error: fetchError } = await supabase
          .from('notes') // Still using the 'notes' table
          .select('*')
          .eq('user_id', session.user.id)
          .eq('type', 'journal') // Filter by type 'journal'
          .order('created_at', { ascending: false }); // Newest first for journal

        if (fetchError) {
          toast.error("Error fetching journal entries from Supabase: " + fetchError.message);
          console.error("Error fetching journal entries (Supabase):", fetchError);
          setJournalEntries([]);
        } else {
          let mergedEntries = [...(supabaseEntries as JournalEntryData[])];

          if (localEntries.length > 0) {
            for (const localEntry of localEntries) {
              const existsInSupabase = mergedEntries.some(
                se => se.content === localEntry.content && se.created_at === localEntry.created_at
              );

              if (!existsInSupabase) {
                const { data: newSupabaseEntry, error: insertError } = await supabase
                  .from('notes')
                  .insert({
                    user_id: session.user.id,
                    title: localEntry.title,
                    content: localEntry.content,
                    starred: localEntry.starred,
                    created_at: localEntry.created_at || new Date().toISOString(),
                    type: 'journal', // Ensure type is 'journal' during migration
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error migrating local journal entry to Supabase:", insertError);
                  toast.error("Error migrating some local journal entries.");
                } else if (newSupabaseEntry) {
                  mergedEntries.push(newSupabaseEntry as JournalEntryData);
                }
              }
            }
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            toast.success("Local journal entries migrated to your account!");
          }
          setJournalEntries(mergedEntries);
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const storedEntriesString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let loadedEntries: JournalEntryData[] = [];
        try {
          loadedEntries = storedEntriesString ? JSON.parse(storedEntriesString) : [];
        } catch (e) {
          console.error("Error parsing local storage journal entries:", e);
          loadedEntries = [];
        }
        // Ensure all loaded entries have a 'type' property, default to 'journal' if missing
        loadedEntries = loadedEntries.map(entry => ({ ...entry, type: entry.type || 'journal' }));
        setJournalEntries(loadedEntries);
        if (loadedEntries.length === 0) {
          toast.info("You are browsing journal entries as a guest. Your entries will be saved locally.");
        }
      }
      setLoading(false);
    };

    loadJournalEntries();
  }, [session, supabase, authLoading]);

  // Effect to save journal entries to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(journalEntries));
    }
  }, [journalEntries, isLoggedInMode, loading]);

  const handleAddJournalEntry = useCallback(async ({ title, content }: { title: string; content: string; }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: session.user.id,
          title,
          content,
          starred: false,
          type: 'journal', // Always 'journal' for this hook
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding journal entry (Supabase): " + error.message);
        console.error("Error adding journal entry (Supabase):", error);
      } else if (data) {
        setJournalEntries((prevEntries) => [data as JournalEntryData, ...prevEntries]); // Add to front for journal
        toast.success("Journal entry added successfully to your account!");
      }
    } else {
      const newEntry: JournalEntryData = {
        id: crypto.randomUUID(),
        title,
        content,
        starred: false,
        created_at: new Date().toISOString(),
        type: 'journal', // Always 'journal' for this hook
      };
      setJournalEntries((prevEntries) => [newEntry, ...prevEntries]); // Add to front for journal
      toast.success("Journal entry added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteJournalEntry = useCallback(async (entryId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', entryId)
        .eq('user_id', session.user.id)
        .eq('type', 'journal'); // Ensure deleting only journal entries

      if (error) {
        toast.error("Error deleting journal entry (Supabase): " + error.message);
        console.error("Error deleting journal entry (Supabase):", error);
      } else {
        setJournalEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
        toast.success("Journal entry deleted from your account.");
      }
    } else {
      setJournalEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      toast.success("Journal entry deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleToggleStarJournalEntry = useCallback(async (entryId: string) => {
    const entryToUpdate = journalEntries.find(entry => entry.id === entryId);
    if (!entryToUpdate) return;

    const newStarredStatus = !entryToUpdate.starred;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .update({ starred: newStarredStatus })
        .eq('id', entryId)
        .eq('user_id', session.user.id)
        .eq('type', 'journal') // Ensure updating only journal entries
        .select()
        .single();

      if (error) {
        toast.error("Error updating star status (Supabase): " + error.message);
        console.error("Error updating star status (Supabase):", error);
      } else if (data) {
        setJournalEntries(prevEntries => prevEntries.map(entry => entry.id === entryId ? data as JournalEntryData : entry));
        toast.info(newStarredStatus ? "Journal entry starred!" : "Journal entry unstarred.");
      }
    } else {
      setJournalEntries(prevEntries => prevEntries.map(entry =>
        entry.id === entryId ? { ...entry, starred: newStarredStatus } : entry
      ));
      toast.info(newStarredStatus ? "Journal entry starred (locally)!" : "Journal entry unstarred (locally).");
    }
  }, [journalEntries, isLoggedInMode, session, supabase]);

  const handleUpdateJournalEntryContent = useCallback(async (entryId: string, newContent: string) => {
    const entryToUpdate = journalEntries.find(entry => entry.id === entryId);
    if (!entryToUpdate) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .update({ content: newContent })
        .eq('id', entryId)
        .eq('user_id', session.user.id)
        .eq('type', 'journal') // Ensure updating only journal entries
        .select()
        .single();

      if (error) {
        toast.error("Error updating journal entry content (Supabase): " + error.message);
        console.error("Error updating journal entry content (Supabase):", error);
      } else if (data) {
        setJournalEntries(prevEntries => prevEntries.map(entry => entry.id === entryId ? data as JournalEntryData : entry));
        // toast.success("Journal entry content updated!"); // Too frequent, removed
      }
    } else {
      setJournalEntries(prevEntries => prevEntries.map(entry =>
        entry.id === entryId ? { ...entry, content: newContent } : entry
      ));
      // toast.success("Journal entry content updated (locally)!"); // Too frequent, removed
    }
  }, [journalEntries, isLoggedInMode, session, supabase]);

  const handleUpdateJournalEntryTitle = useCallback(async (entryId: string, newTitle: string) => {
    const entryToUpdate = journalEntries.find(entry => entry.id === entryId);
    if (!entryToUpdate) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .update({ title: newTitle })
        .eq('id', entryId)
        .eq('user_id', session.user.id)
        .eq('type', 'journal') // Ensure updating only journal entries
        .select()
        .single();

      if (error) {
        toast.error("Error updating journal entry title (Supabase): " + error.message);
        console.error("Error updating journal entry title (Supabase):", error);
      } else if (data) {
        setJournalEntries(prevEntries => prevEntries.map(entry => entry.id === entryId ? data as JournalEntryData : entry));
        toast.success("Journal entry title updated!");
      }
    } else {
      setJournalEntries(prevEntries => prevEntries.map(entry =>
        entry.id === entryId ? { ...entry, title: newTitle } : entry
      ));
      toast.success("Journal entry title updated (locally)!");
    }
  }, [journalEntries, isLoggedInMode, session, supabase]);

  return {
    journalEntries,
    loading,
    isLoggedInMode,
    handleAddJournalEntry,
    handleDeleteJournalEntry,
    handleToggleStarJournalEntry,
    handleUpdateJournalEntryContent,
    handleUpdateJournalEntryTitle,
  };
}