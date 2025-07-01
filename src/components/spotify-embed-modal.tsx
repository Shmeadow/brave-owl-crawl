"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const LOCAL_STORAGE_SPOTIFY_EMBED_KEY = 'spotify_embed_url';

const spotifyUrlSchema = z.object({
  url: z.string().url({ message: "Invalid URL format." }).refine(
    (url) => url.includes("spotify.com/embed/"),
    { message: "URL must be a Spotify embed URL (e.g., from Spotify's 'Embed track' option)." }
  ),
});

interface SpotifyEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpotifyEmbedModal({ isOpen, onClose }: SpotifyEmbedModalProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof spotifyUrlSchema>>({
    resolver: zodResolver(spotifyUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY);
      if (savedUrl) {
        setEmbedUrl(savedUrl);
        form.setValue("url", savedUrl);
      }
    }
  }, []);

  const onSubmit = (values: z.infer<typeof spotifyUrlSchema>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY, values.url);
      setEmbedUrl(values.url);
      toast.success("Spotify embed URL saved!");
      onClose();
    }
  };

  const handleRemoveEmbed = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY);
      setEmbedUrl(null);
      form.reset({ url: "" });
      toast.info("Spotify embed removed.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Embed Spotify Player</DialogTitle>
          <DialogDescription>
            Paste a Spotify embed URL (e.g., from Spotify's "Embed track" option) to display it in your app.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spotify Embed URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://open.spotify.com/embed/track/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              {embedUrl && (
                <Button type="button" variant="outline" onClick={handleRemoveEmbed}>
                  Remove Embed
                </Button>
              )}
              <Button type="submit">Save Embed</Button>
            </div>
          </form>
        </Form>

        {embedUrl && (
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">Current Embed:</h3>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="absolute top-0 left-0 w-full h-full rounded-md"
              ></iframe>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}