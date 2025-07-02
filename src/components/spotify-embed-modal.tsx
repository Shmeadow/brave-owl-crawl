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

// Helper function to convert a regular Spotify URL to an embed URL
const convertToEmbedUrl = (url: string): string | null => {
  const regex = /open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  if (match && match[1] && match[2]) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  // If it's already an embed URL, return it as is
  if (url.includes("spotify.com/embed/")) {
    return url;
  }
  return null; // Not a valid Spotify URL or embed URL
};

const spotifyUrlSchema = z.object({
  url: z.string().min(1, { message: "URL cannot be empty." }).refine(
    (url) => {
      // Allow both regular Spotify URLs and embed URLs
      return url.includes("open.spotify.com/") && (url.includes("/track/") || url.includes("/playlist/") || url.includes("/album/"));
    },
    { message: "Please enter a valid Spotify track, playlist, or album URL." }
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
  }, [isOpen]);

  const onSubmit = (values: z.infer<typeof spotifyUrlSchema>) => {
    if (typeof window !== 'undefined') {
      const convertedUrl = convertToEmbedUrl(values.url);
      if (convertedUrl) {
        localStorage.setItem(LOCAL_STORAGE_SPOTIFY_EMBED_KEY, convertedUrl);
        setEmbedUrl(convertedUrl);
        toast.success("Spotify embed URL saved!");
        onClose();
      } else {
        toast.error("Could not convert URL to Spotify embed format. Please check the URL.");
      }
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
      <DialogContent className="sm:max-w-[425px] z-[1001] bg-card/40 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle>Embed Spotify Player</DialogTitle>
          <DialogDescription>
            Paste a Spotify track, playlist, or album URL. It will be converted to an embeddable player.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spotify URL</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., https://open.spotify.com/track/..." {...field} />
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
            <h3 className="text-md font-semibold mb-2">Currently Embedded:</h3>
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