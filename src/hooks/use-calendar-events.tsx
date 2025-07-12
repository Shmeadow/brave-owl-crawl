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
}

const LOCAL_STORAGE_KEY = 'guest_calendar_events';

export function useCalendarEvents() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (session) {
        setIsLoggedInMode(true);
        let query = supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', session.user.id);

        if (currentRoomId) {
          query = query.eq('room_id', currentRoomId);
        } else {
          query = query.is('room_id', null);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        setEvents(data as CalendarEventData[]);
      } else {
        setIsLoggedInMode(false);
        const storedEvents = localStorage.getItem(LOCAL_STORAGE_KEY);
        setEvents(storedEvents ? JSON.parse(storedEvents) : []);
      }
    } catch (error: any) {
      toast.error("Failed to load calendar events: " + error.message);
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  }, [session, supabase, currentRoomId]);

  useEffect(() => {
    if (!authLoading) {
      fetchEvents();
    }
  }, [authLoading, fetchEvents]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, isLoggedInMode, loading]);

  const handleAddEvent = useCallback(async (title: string, description: string | null, eventDate: string) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ user_id: session.user.id, room_id: currentRoomId, title, description, event_date: eventDate })
        .select()
        .single();
      if (error) toast.error("Error adding event: " + error.message);
      else if (data) setEvents(prev => [...prev, data as CalendarEventData]);
    } else {
      const newEvent: CalendarEventData = { id: crypto.randomUUID(), room_id: null, title, description, event_date: eventDate, created_at: new Date().toISOString() };
      setEvents(prev => [...prev, newEvent]);
    }
  }, [isLoggedInMode, session, supabase, currentRoomId]);

  const handleUpdateEvent = useCallback(async (eventId: string, updatedData: Partial<CalendarEventData>) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('calendar_events').update(updatedData).eq('id', eventId).select().single();
      if (error) toast.error("Error updating event: " + error.message);
      else if (data) setEvents(prev => prev.map(e => e.id === eventId ? data as CalendarEventData : e));
    } else {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updatedData } : e));
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
      if (error) toast.error("Error deleting event: " + error.message);
      else setEvents(prev => prev.filter(e => e.id !== eventId));
    } else {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  }, [isLoggedInMode, session, supabase]);

  return { events, loading, isLoggedInMode, handleAddEvent, handleUpdateEvent, handleDeleteEvent };
}