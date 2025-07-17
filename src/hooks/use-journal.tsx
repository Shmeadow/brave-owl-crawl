"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface JournalEntryData {
  id: string;
  user_id?: string; // Optional for local storage entries
  title: string | null;
  content: string; // Now stores HTML content
  created_at: string;
  type: 'note' | 'journal'; // Will always be 'journal' for this hook
}

export interface ImportantReminder {
  entryId: string; // Added entryId
  entryTitle: string | null;
  text: string | null;
  timestamp: string;
}

const LOCAL_STORAGE_KEY = 'guest_journal_entries'; // Keep for initial migration check

export function useJournal() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [journalEntries, setJournalEntries] = useState<JournalEntryData[]>([]);
  const [importantReminders, setImportantReminders] = useState<ImportantReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // Function to extract important reminders from journal entries
  const extractImportantReminders = useCallback((entries: JournalEntryData[]): ImportantReminder[] => {
    const reminders: ImportantReminder[] = [];

    entries.forEach(entry => {
      if (entry.type === 'journal' && entry.content) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(entry.content, 'text/html');
          // Look for elements with the 'fr-important-yellow' class (or other important classes)
          const importantSpans = doc.querySelectorAll('[class*="fr-important-"]');
          importantSpans.forEach(span => {
            reminders.push({
              entryId: entry.id, // Include entryId
              entryTitle: entry.title,
              text: span.textContent,
              timestamp: entry.created_at,
            });
          });
        } catch (e) {
          console.error("Error parsing entry content for reminders:", e);
        }
      }
    });
    // Sort reminders by timestamp, newest first
    reminders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return reminders;
  }, []);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadJournalEntries = async () => {
      setLoading(true);
      if (session && supabase) {
        // User is logged in
        setIsLoggedInMode(true);
        
        // Attempt to migrate local entries first (one-time operation)
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
          .select('id, user_id, title, content, created_at, type') // Select specific columns
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
                    created_at: localEntry.created_at || new Date().toISOString(),
                    type: 'journal', // Ensure type is 'journal' during migration
                  })
                  .select('id, user_id, title, content, created_at, type') // Select specific columns
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

  // Effect to update reminders whenever journal entries change
  useEffect(() => {
    setImportantReminders(extractImportantReminders(journalEntries));
  }, [journalEntries, extractImportantReminders]);

  // Realtime subscription for logged-in users
  useEffect(() => {
    if (!supabase || !session?.user?.id || !isLoggedInMode) return;

    const channel = supabase.channel('journal_entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${session.user.id}` }, (payload) => {
        const newEntry = payload.new as JournalEntryData;
        const oldEntry = payload.old as JournalEntryData;

        if (newEntry?.type !== 'journal' && oldEntry?.type !== 'journal') return; // Only process journal entries

        if (payload.eventType === 'INSERT') {
          setJournalEntries(prev => [newEntry, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setJournalEntries(prev => prev.map(entry => entry.id === newEntry.id ? newEntry : entry));
        } else if (payload.eventType === 'DELETE') {
          setJournalEntries(prev => prev.filter(entry => entry.id !== oldEntry.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session, isLoggedInMode]);

  const handleAddJournalEntry = useCallback(async ({ title, content }: { title: string; content: string; }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: session.user.id,
          title,
          content,
          type: 'journal', // Always 'journal' for this hook
        })
        .select('id, user_id, title, content, created_at, type') // Select specific columns
        .single();

      if (error) {
        toast.error("Error adding journal entry (Supabase): " + error.message);
        console.error("Error adding journal entry (Supabase):", error);
      } else if (data) {
        // State update handled by realtime subscription
        toast.success("Journal entry added successfully to your account!");
      }
    } else {
      const newEntry: JournalEntryData = {
        id: crypto.randomUUID(),
        title,
        content,
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
        // State update handled by realtime subscription
        toast.success("Journal entry deleted from your account.");
      }
    } else {
      setJournalEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      toast.success("Journal entry deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

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
        .select('id, user_id, title, content, created_at, type') // Select specific columns
        .single();

      if (error) {
        toast.error("Error updating journal entry content (Supabase): " + error.message);
        console.error("Error updating journal entry content (Supabase):", error);
      } else if (data) {
        // State update handled by realtime subscription
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
        .select('id, user_id, title, content, created_at, type') // Select specific columns
        .single();

      if (error) {
        toast.error("Error updating journal entry title (Supabase): " + error.message);
        console.error("Error updating journal entry title (Supabase):", error);
      } else if (data) {
        // State update handled by realtime subscription
        toast.success("Journal entry title updated!");
      }
    } else {
      setJournalEntries(prevEntries => prevEntries.map(entry =>
        entry.id === entryId ? { ...entry, title: newTitle } : entry
      ));
      toast.success("Journal entry title updated (locally)!");
    }
  }, [journalEntries, isLoggedInMode, session, supabase]);

  const handleBulkImportJournalEntries = useCallback(async (newEntries: { title: string; content: string }[]): Promise<number> => {
    const uniqueNewEntries = newEntries.filter(ne => !journalEntries.some(ee => ee.title === ne.title && ee.content === ne.content));
    if (uniqueNewEntries.length === 0) {
      toast.info("No new entries to import.");
      return 0;
    }

    if (isLoggedInMode && session && supabase) {
      const toInsert = uniqueNewEntries.map(entry => ({
        user_id: session.user.id,
        title: entry.title,
        content: entry.content,
        type: 'journal',
      }));
      const { data, error } = await supabase.from('notes').insert(toInsert).select('id, user_id, title, content, created_at, type');
      if (error) {
        toast.error("Error importing entries: " + error.message);
        return 0;
      } else if (data) {
        // State update handled by realtime subscription
        return data.length;
      }
    } else {
      const guestEntries: JournalEntryData[] = uniqueNewEntries.map(entry => ({
        id: crypto.randomUUID(),
        title: entry.title,
        content: entry.content,
        created_at: new Date().toISOString(),
        type: 'journal',
      }));
      setJournalEntries(prev => [...guestEntries, ...prev]); // Add new entries to the front
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...guestEntries, ...journalEntries]));
      return guestEntries.length;
    }
    return 0;
  }, [journalEntries, isLoggedInMode, session, supabase, setJournalEntries]);

  const generateJournalExportText = useCallback((entries: JournalEntryData[], colSep: string, rowSep: string, format: 'csv' | 'json' | 'text'): string => {
    if (entries.length === 0) return "";

    if (format === 'json') {
      return JSON.stringify(entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        content: entry.content,
        created_at: entry.created_at,
      })), null, 2);
    }

    const header = `"title"${colSep}"content"`;
    const rows = entries.map(entry => {
      const title = `"${(entry.title || '').replace(/"/g, '""')}"`;
      let contentText = entry.content;
      // For CSV/text export, convert HTML content to plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentText;
      contentText = tempDiv.textContent || '';
      
      const content = `"${contentText.replace(/"/g, '""')}"`;
      return `${title}${colSep}${content}`;
    });
    return header + rowSep + rows.join(rowSep);
  }, []);

  return {
    journalEntries,
    importantReminders,
    loading,
    isLoggedInMode,
    handleAddJournalEntry,
    handleDeleteJournalEntry,
    handleUpdateJournalEntryContent,
    handleUpdateJournalEntryTitle,
    handleBulkImportJournalEntries,
    generateJournalExportText,
  };
}