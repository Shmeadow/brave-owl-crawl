"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useCurrentRoom } from "./use-current-room";
import { toast } from "sonner";

export interface CalendarEventData {
  id: string;
  user_id?: string;
  room_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
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
      const localEventsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localEvents: CalendarEventData[] = [];
      try {
        localEvents = localEventsString ? JSON.parse(localEventsString) : [];
      } catch (e) {
        console.error("Error parsing local storage events:", e);
      }

      const query = supabase.from('calendar_events').select('*');
      if (currentRoomId) {
        query.eq('room_id', currentRoomId);
      } else {
        query.is('room_id', null).eq('user_id', session.user.id);
      }
      const { data: supabaseEvents, error: fetchError } = await query.order('event_date', { ascending: true }).order('created_at', { ascending: true });

      if (fetchError) {
        toast.error("Error fetching calendar events: " + fetchError.message);
        setEvents([]);
      } else {
        let mergedEvents = [...(supabaseEvents as CalendarEventData[])];
        if (localEvents.length > 0 && !currentRoomId) {
          for (const localEvent of localEvents) {
            const existsInSupabase = mergedEvents.some(se => se.title === localEvent.title && se.event_date === localEvent.event_date);
            if (!existsInSupabase) {
              const { data: newSupabaseEvent, error: insertError } = await supabase
                .from('calendar_events')
                .insert({
                  user_id: session.user.id,
                  room_id: null,
                  title: localEvent.title,
                  description: localEvent.description,
                  event_date: localEvent.event_date,
                  created_at: localEvent.created_at || new Date().toISOString(),
                })
                .select()
                .single();
              if (insertError) {
                console.error("Error migrating local event:", insertError);
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
      setIsLoggedInMode(false);
      const storedEventsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedEvents: CalendarEventData[] = [];
      try {
        loadedEvents = storedEventsString ? JSON.parse(storedEventsString) : [];
      } catch (e) {
        console.error("Error parsing local storage events:", e);
      }
      setEvents(loadedEvents);
    }
    setLoading(false);
  }, [session, supabase, authLoading, currentRoomId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, isLoggedInMode, loading]);

  useEffect(() => {
    if (!currentRoomId || !supabase) return;
    const channel = supabase.channel(`room-calendar-${currentRoomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `room_id=eq.${currentRoomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [...prev, payload.new as CalendarEventData]);
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => e.id === (payload.new as CalendarEventData).id ? payload.new as CalendarEventData : e));
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== (payload.old as any).id));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRoomId, supabase]);

  const handleAddEvent = useCallback(async (title: string, description: string | null, eventDate: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: session.user.id,
          room_id: currentRoomId,
          title: title,
          description: description,
          event_date: eventDate,
        });
      if (error) {
        toast.error("Error adding event: " + error.message);
      } else {
        toast.success("Event added successfully!");
      }
    } else {
      if (currentRoomId) {
        toast.error("You must be logged in to add events to a room.");
        return;
      }
      const newEvent: CalendarEventData = {
        id: crypto.randomUUID(),
        room_id: null,
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
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('calendar_events')
        .update(updatedData)
        .eq('id', eventId);
      if (error) {
        toast.error("Error updating event: " + error.message);
      } else {
        toast.success("Event updated successfully!");
      }
    } else {
      setEvents(prevEvents => prevEvents.map(event =>
        event.id === eventId ? { ...event, ...updatedData, updated_at: new Date().toISOString() } : event
      ));
      toast.success("Event updated (locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
      if (error) {
        toast.error("Error deleting event: " + error.message);
      } else {
        toast.success("Event deleted.");
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