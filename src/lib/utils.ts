import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getYouTubeVideoId(url: string): string | null {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    // Parameters for a minimalistic, looping background player with controls:
    // autoplay=1: Starts playing automatically
    // loop=1: Loops the video (requires playlist parameter with the same video ID)
    // playlist=${videoId}: Required for loop=1 to work with a single video
    // controls=1: Shows player controls
    // modestbranding=1: Shows a smaller YouTube logo
    // rel=0: Prevents showing related videos at the end
    // disablekb=1: Disables keyboard controls
    // fs=0: Disables the fullscreen button
    // iv_load_policy=3: Hides video annotations
    // enablejsapi=1: Enables JavaScript API for programmatic control
    // origin: Crucial for API to work, will be set by the player itself
    // Note: The 'showinfo=0' parameter is deprecated and may not always hide the video title within the player.
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1`;
  }
  return null;
}