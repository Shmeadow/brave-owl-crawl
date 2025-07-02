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
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { useMediaPlayer } from '@/components/media-player-context'; // Import useMediaPlayer

const youtubeUrlSchema = z.object({
  url: z.string().min(1, { message: "URL cannot be empty." }).refine(
    (url) => {
      return url.includes("youtube.com/") || url.includes("youtu.be/");
    },
    { message: "Please enter a valid YouTube video URL." }
  ),
});

interface YoutubeEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YoutubeEmbedModal({ isOpen, onClose }: YoutubeEmbedModalProps) {
  const { youtubeEmbedUrl, setYoutubeEmbedUrl, setActivePlayer } = useMediaPlayer(); // Use context
  const form = useForm<z.infer<typeof youtubeUrlSchema>>({
    resolver: zodResolver(youtubeUrlSchema),
    defaultValues: {
      url: youtubeEmbedUrl || "", // Initialize with current context value
    },
  });

  useEffect(() => {
    // Update form default if context URL changes externally
    form.reset({ url: youtubeEmbedUrl || "" });
  }, [youtubeEmbedUrl, form]);

  const onSubmit = (values: z.infer<typeof youtubeUrlSchema>) => {
    const convertedUrl = getYouTubeEmbedUrl(values.url);
    if (convertedUrl) {
      setYoutubeEmbedUrl(convertedUrl); // Update context
      setActivePlayer('youtube'); // Set YouTube as the active player
      toast.success("YouTube embed URL saved and activated!");
      onClose();
    } else {
      toast.error("Could not convert URL to YouTube embed format. Please check the URL.");
    }
  };

  const handleRemoveEmbed = () => {
    setYoutubeEmbedUrl(null); // Clear URL in context
    setActivePlayer(null); // No player active
    form.reset({ url: "" });
    toast.info("YouTube embed removed.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[1001] bg-card/40 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
          <DialogDescription>
            Paste a YouTube video URL. It will be converted to an embeddable player.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube URL</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., https://www.youtube.com/watch?v=..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              {youtubeEmbedUrl && (
                <Button type="button" variant="outline" onClick={handleRemoveEmbed}>
                  Remove Embed
                </Button>
              )}
              <Button type="submit">Save Embed</Button>
            </div>
          </form>
        </Form>

        {youtubeEmbedUrl && (
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">Currently Embedded:</h3>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
              <iframe
                src={youtubeEmbedUrl}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
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