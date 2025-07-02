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
import { getYouTubeEmbedUrl } from "@/lib/utils"; // Import the new utility

const LOCAL_STORAGE_YOUTUBE_EMBED_KEY = 'youtube_embed_url';

const youtubeUrlSchema = z.object({
  url: z.string().min(1, { message: "URL cannot be empty." }).refine(
    (url) => {
      // Basic check for YouTube domain
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
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof youtubeUrlSchema>>({
    resolver: zodResolver(youtubeUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY);
      if (savedUrl) {
        setEmbedUrl(savedUrl);
        form.setValue("url", savedUrl);
      }
    }
  }, [isOpen, form]);

  const onSubmit = (values: z.infer<typeof youtubeUrlSchema>) => {
    if (typeof window !== 'undefined') {
      const convertedUrl = getYouTubeEmbedUrl(values.url);
      if (convertedUrl) {
        localStorage.setItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY, convertedUrl);
        setEmbedUrl(convertedUrl);
        toast.success("YouTube embed URL saved!");
        onClose();
      } else {
        toast.error("Could not convert URL to YouTube embed format. Please check the URL.");
      }
    }
  };

  const handleRemoveEmbed = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY);
      setEmbedUrl(null);
      form.reset({ url: "" });
      toast.info("YouTube embed removed.");
    }
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