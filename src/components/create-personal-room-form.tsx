"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1, { message: "Room name cannot be empty." }),
  description: z.string().optional(),
  type: z.enum(['public', 'private']),
});

interface CreatePersonalRoomFormProps {
  onRoomCreated: (room: RoomData) => void;
  onClose: () => void;
}

export function CreatePersonalRoomForm({ onRoomCreated, onClose }: CreatePersonalRoomFormProps) {
  const { session } = useSupabase();
  const { handleCreateRoom } = useRooms();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "private", // Default to private for personal rooms
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session) {
      toast.error("You must be logged in to create a room.");
      return;
    }
    const { data, error } = await handleCreateRoom(values.name.trim(), values.type, values.description?.trim() || null);
    if (!error && data) {
      toast.success(`Your personal room "${data.name}" created successfully!`);
      onRoomCreated(data);
      onClose();
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Create Your Personal Room</h3>
      <p className="text-sm text-muted-foreground">
        This will be your primary private space. You can only create one personal room.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., My Cozy Study Space" {...field} disabled={!session} />
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
                  <Textarea placeholder="A brief description of your room..." {...field} rows={3} disabled={!session} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!session}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[1200]">
                    <SelectItem value="private">Private (Invite/Password Only)</SelectItem>
                    <SelectItem value="public">Public (Anyone Can Join by ID)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={!session || form.formState.isSubmitting}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Room
          </Button>
        </form>
      </Form>
    </div>
  );
}