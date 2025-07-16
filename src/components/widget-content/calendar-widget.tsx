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
import { useCalendarEvents } from "@/hooks/use-calendar-events"; // Import the new hook

const eventFormSchema = z.object({
  title: z.string().min(1, { message: "Event title cannot be empty." }),
  description: z.string().optional(),
});

interface CalendarWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function CalendarWidget({ isCurrentRoomWritable }: CalendarWidgetProps) {
  const { events, loading, isLoggedInMode, handleAddEvent, handleDeleteEvent } = useCalendarEvents();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onAddEventSubmit = useCallback(async (values: z.infer<typeof eventFormSchema>) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to add events in this room.");
      return;
    }
    if (!date) {
      toast.error("Please select a date for the event.");
      return;
    }
    const eventDate = format(date, 'yyyy-MM-dd');
    await handleAddEvent(values.title, values.description || null, eventDate);
    form.reset();
    toast.success("Event added successfully!");
  }, [date, handleAddEvent, form, isCurrentRoomWritable]);

  const onDeleteEventClick = useCallback(async (eventId: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to delete events in this room.");
      return;
    }
    await handleDeleteEvent(eventId);
    toast.success("Event deleted.");
  }, [handleDeleteEvent, isCurrentRoomWritable]);

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

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground">Your Calendar</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <Card className="p-4 flex flex-col items-center bg-card backdrop-blur-xl border-white/20">
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

          <Card className="p-4 flex flex-col bg-card backdrop-blur-xl border-white/20">
            <CardHeader className="w-full text-center pb-4">
              <CardTitle className="text-xl">
                Events for {date ? format(date, 'PPP') : 'Selected Date'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddEventSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Team Meeting" {...field} disabled={!isCurrentRoomWritable} />
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
                          <Textarea placeholder="Details about the event..." {...field} rows={2} disabled={!isCurrentRoomWritable} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={!date || !isCurrentRoomWritable}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Event
                  </Button>
                </form>
              </Form>

              <div className="mt-4 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Upcoming Events:</h3>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center">No events for this date.</p>
                ) : (
                  <ScrollArea className="flex-1 max-h-[300px] lg:max-h-[unset]">
                    <div className="space-y-2 pr-2">
                      {selectedDayEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-2 border rounded-md bg-muted backdrop-blur-md">
                          <div>
                            <p className="font-medium text-sm">{event.title}</p>
                            {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-100 hover:text-red-600 h-7 w-7"
                            onClick={() => onDeleteEventClick(event.id)}
                            disabled={!isCurrentRoomWritable}
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
    </div>
  );
}