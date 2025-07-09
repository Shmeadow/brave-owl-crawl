"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useCurrentRoom } from "./use-current-room";
import { toast } from "sonner";

export interface CalendarEventData {
  id: string;
  user_id?: string; // Optional for local storage events
  room_id: string | null;
  title: string;
  description: string | null;
  event_date: string; // Stored as 'YYYY-MM-DD' string
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_calendar_events';

export function useCalendarEvents() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      // 1. Load local events (if any) for migration
      const localEventsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localEvents: CalendarEventData[] = [];
      try {
        localEvents = localEventsString ? JSON.parse(localEventsString) : [];
      } catch (e) {
        console.error("Error parsing local storage events:", e);
        localEvents = [];
      }

      // 2. Fetch user's existing events from Supabase
      const { data: supabaseEvents, error: fetchError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('event_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchError) {
        toast.error("Error fetching calendar events from Supabase: " + fetchError.message);
        console.error("Error fetching events (Supabase):", fetchError);
        setEvents([]);
      } else {
        let mergedEvents = [...(supabaseEvents as CalendarEventData[])];

        // 3. Migrate local events to Supabase if they don't already exist
        if (localEvents.length > 0) {
          for (const localEvent of localEvents) {
            const existsInSupabase = mergedEvents.some(
              se => se.title === localEvent.title && se.event_date === localEvent.event_date
            );

            if (!existsInSupabase) {
              const { data: newSupabaseEvent, error: insertError } = await supabase
                .from('calendar_events')
                .insert({
                  user_id: session.user.id,
                  room_id: null, // Local events are personal, not room-specific
                  title: localEvent.title,
                  description: localEvent.description,
                  event_date: localEvent.event_date,
                  created_at: localEvent.created_at || new Date().toISOString(),
                })
                .select()
                .single();

              if (insertError) {
                console.error("Error migrating local event to Supabase:", insertError);
                toast.error("Error migrating some local events.");
              } else if (newSupabaseEvent) {
                mergedEvents.push(newSupabaseEvent as CalendarEventData);
              }
            }
          }
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          toast.success("Local calendar events migrated to your account!");
        }
        setEvents(mergedEvents);
      }
    } else {
      // User is a guest (not logged in)
      setIsLoggedInMode(false);
      const storedEventsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedEvents: CalendarEventData[] = [];
      try {
        loadedEvents = storedEventsString ? JSON.parse(storedEventsString) : [];
      } catch (e) {
        console.error("Error parsing local storage events:", e);
        loadedEvents = [];
      }
      setEvents(loadedEvents);
      if (loadedEvents.length === 0) {
        toast.info("You are browsing calendar events as a guest. Your events will be saved locally.");
      }
    }
    setLoading(false);
  }, [session, supabase, authLoading]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Effect to save events to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, isLoggedInMode, loading]);

  const handleAddEvent = useCallback(async (title: string, description: string | null, eventDate: string) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: session.user.id,
          room_id: currentRoomId, // Link to current room if available
          title: title,
          description: description,
          event_date: eventDate,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding event (Supabase): " + error.message);
        console.error("Error adding event (Supabase):", error);
      } else if (data) {
        setEvents((prevEvents) => [...prevEvents, data as CalendarEventData]);
        toast.success("Event added successfully to your account!");
      }
    } else {
      const newEvent: CalendarEventData = {
        id: crypto.randomUUID(),
        room_id: null, // Guest events are always personal
        title: title,
        description: description,
        event_date: eventDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
      toast.success("Event added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const handleUpdateEvent = useCallback(async (eventId: string, updatedData: Partial<Omit<CalendarEventData, 'id' | 'user_id' | 'room_id' | 'created_at' | 'updated_at'>>) => {
    const eventToUpdate = events.find(event => event.id === eventId);
    if (!eventToUpdate) return;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updatedData)
        .eq('id', eventId)
        .eq('user_id', session.user.id) // Ensure user owns the event
        .select()
        .single();

      if (error) {
        toast.error("Error updating event (Supabase): " + error.message);
        console.error("Error updating event (Supabase):", error);
      } else if (data) {
        setEvents(prevEvents => prevEvents.map(event => event.id === eventId ? data as CalendarEventData : event));
        toast.success("Event updated successfully!");
      }
    } else {
      setEvents(prevEvents => prevEvents.map(event =>
        event.id === eventId ? { ...event, ...updatedData, updated_at: new Date().toISOString() } : event
      ));
      toast.success("Event updated (locally)!");
    }
  }, [events, isLoggedInMode, session, supabase]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', session.user.id); // Ensure user owns the event

      if (error) {
        toast.error("Error deleting event (Supabase): " + error.message);
        console.error("Error deleting event (Supabase):", error);
      } else {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        toast.success("Event deleted from your account.");
      }
    } else {
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      toast.success("Event deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  return {
    events,
    loading,
    isLoggedInMode,
    handleAddEvent,
    handleUpdateEvent,
    handleDeleteEvent,
  };
}