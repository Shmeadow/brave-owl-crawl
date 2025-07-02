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
import { useMediaPlayer } from '@/components/media-player-context';

// Helper function to convert a regular Spotify URL to an embed URL
const convertToEmbedUrl = (url: string): string | null => {
  const regex = /open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  if (match && match[1] && match[2]) {
    if (match[1] === 'playlist' || match[1] === 'album') {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
    }
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  if (url.includes("spotify.com/embed/")) {
    return url;
  }
  return null;
};

const spotifyUrlSchema = z.object({
  url: z.string().min(1, { message: "URL cannot be empty." }).refine(
    (url) => {
      return url.includes("open.spotify.com/") && (url.includes("/track/") || url.includes("/playlist/") || url.includes("/album/"));
    },
    { message: "Please enter a valid Spotify track, playlist, or album URL." }
  ),
});

interface SpotifyEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCurrentRoomWritable: boolean; // New prop
}

export function SpotifyEmbedModal({ isOpen, onClose, isCurrentRoomWritable }: SpotifyEmbedModalProps) {
  const { spotifyEmbedUrl, setSpotifyEmbedUrl, setActivePlayer } = useMediaPlayer();

  const form = useForm<z.infer<typeof spotifyUrlSchema>>({
    resolver: zodResolver(spotifyUrlSchema),
    defaultValues: {
      url: spotifyEmbedUrl || "",
    },
  });

  useEffect(() => {
    form.reset({ url: spotifyEmbedUrl || "" });
  }, [spotifyEmbedUrl, form]);

  const onSubmit = (values: z.infer<typeof spotifyUrlSchema>) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to embed Spotify players in this room.");
      return;
    }
    const convertedUrl = convertToEmbedUrl(values.url);
    if (convertedUrl) {
      setSpotifyEmbedUrl(convertedUrl);
      setActivePlayer('spotify');
      toast.success("Spotify embed URL saved and activated!");
      onClose();
    } else {
      toast.error("Could not convert URL to Spotify embed format. Please check the URL.");
    }
  };

  const handleRemoveEmbed = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to remove Spotify embeds in this room.");
      return;
    }
    setSpotifyEmbedUrl(null);
    setActivePlayer(null);
    form.reset({ url: "" });
    toast.info("Spotify embed removed.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[1001] bg-card backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle>Embed Spotify Player</DialogTitle>
          <DialogDescription>
            Paste a Spotify **track, playlist, or album** URL. It will be converted to an embeddable player.
            <br />
            <span className="text-yellow-400 font-semibold">
              Note: Due to Spotify's API limitations, external play/pause/volume controls are not available.
              Please use the controls directly within the embedded Spotify player.
            </span>
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
                    <Input placeholder="e.g., https://open.spotify.com/playlist/..." {...field} disabled={!isCurrentRoomWritable} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              {spotifyEmbedUrl && (
                <Button type="button" variant="outline" onClick={handleRemoveEmbed} disabled={!isCurrentRoomWritable}>
                  Remove Embed
                </Button>
              )}
              <Button type="submit" disabled={!isCurrentRoomWritable}>Save Embed</Button>
            </div>
          </form>
        </Form>

        {spotifyEmbedUrl && (
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">Currently Embedded:</h3>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={spotifyEmbedUrl}
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