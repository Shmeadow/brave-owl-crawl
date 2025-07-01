"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarEvent {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  event_date: string; // ISO date string
  created_at: string;
}

const LOCAL_STORAGE_KEY_EVENTS = 'guest_calendar_events';

const eventFormSchema = z.object({
  title: z.string().min(1, { message: "Event title cannot be empty." }),
  description: z.string().optional(),
});

export function CalendarPanel() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const fetchEvents = useCallback(async () => {
    if (authLoading) return;

    setLoadingEvents(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      // Migrate local events first
      const localEventsString = localStorage.getItem(LOCAL_STORAGE_KEY_EVENTS);
      let localEvents: CalendarEvent[] = [];
      try {
        localEvents = localEventsString ? JSON.parse(localEventsString) : [];
      } catch (e) {
        console.error("Error parsing local storage events:", e);
        localEvents = [];
      }

      const { data: supabaseEvents, error: fetchError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('event_date', { ascending: true });

      if (fetchError) {
        toast.error("Error fetching calendar events: " + fetchError.message);
        console.error("Error fetching events (Supabase):", fetchError);
        setEvents([]);
      } else {
        let mergedEvents = [...(supabaseEvents as CalendarEvent[])];

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
                mergedEvents.push(newSupabaseEvent as CalendarEvent);
              }
            }
          }
          localStorage.removeItem(LOCAL_STORAGE_KEY_EVENTS);
          toast.success("Local calendar events migrated!");
        }
        setEvents(mergedEvents);
      }
    } else {
      setIsLoggedInMode(false);
      const storedEventsString = localStorage.getItem(LOCAL_STORAGE_KEY_EVENTS);
      let loadedEvents: CalendarEvent[] = [];
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
    setLoadingEvents(false);
  }, [session, supabase, authLoading]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!isLoggedInMode && !loadingEvents) {
      localStorage.setItem(LOCAL_STORAGE_KEY_EVENTS, JSON.stringify(events));
    }
  }, [events, isLoggedInMode, loadingEvents]);

  const handleAddEvent = useCallback(async (values: z.infer<typeof eventFormSchema>) => {
    if (!date) {
      toast.error("Please select a date for the event.");
      return;
    }
    const eventDate = format(date, 'yyyy-MM-dd');

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: session.user.id,
          title: values.title,
          description: values.description || null,
          event_date: eventDate,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding event: " + error.message);
        console.error("Error adding event (Supabase):", error);
      } else if (data) {
        setEvents((prevEvents) => [...prevEvents, data as CalendarEvent]);
        toast.success("Event added successfully!");
        form.reset();
      }
    } else {
      const newEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        title: values.title,
        description: values.description || null,
        event_date: eventDate,
        created_at: new Date().toISOString(),
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
      toast.success("Event added successfully (saved locally)!");
      form.reset();
    }
  }, [date, isLoggedInMode, session, supabase, form]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error deleting event: " + error.message);
        console.error("Error deleting event (Supabase):", error);
      } else {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        toast.success("Event deleted.");
      }
    } else {
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      toast.success("Event deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  const selectedDayEvents = date
    ? events.filter(event => event.event_date === format(date, 'yyyy-MM-dd'))
    : [];

  const modifiers = {
    hasEvent: events.map(event => new Date(event.event_date)),
  };

  const modifiersStyles = {
    hasEvent: {
      border: '2px solid hsl(var(--primary))',
      borderRadius: '50%',
    },
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto h-full">
      <h1 className="text-3xl font-bold text-foreground">Your Calendar</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <Card className="bg-card/80 backdrop-blur-md p-4 flex flex-col items-center">
          <CardHeader className="w-full text-center pb-4">
            <CardTitle className="text-xl">Select a Date</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-md p-4 flex flex-col">
          <CardHeader className="w-full text-center pb-4">
            <CardTitle className="text-xl">
              Events for {date ? format(date, 'PPP') : 'Selected Date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddEvent)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Team Meeting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Details about the event..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={!date}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Event
                </Button>
              </form>
            </Form>

            <div className="mt-4 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold mb-2">Upcoming Events:</h3>
              {loadingEvents ? (
                <p className="text-muted-foreground text-sm text-center">Loading events...</p>
              ) : selectedDayEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center">No events for this date.</p>
              ) : (
                <ScrollArea className="flex-1 max-h-[300px] lg:max-h-[unset]">
                  <div className="space-y-2 pr-2">
                    {selectedDayEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-100 hover:text-red-600 h-7 w-7"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Event</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground mt-4 text-center">
        Note: Integration with external calendar applications like Google Calendar or Outlook is a complex feature that requires OAuth authentication and API interactions, and is beyond the scope of this current development iteration.
      </p>
      {!isLoggedInMode && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          You are currently browsing calendar events as a guest. Your events are saved locally in your browser. Log in to save them to your account!
        </p>
      )}
    </div>
  );
}