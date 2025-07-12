import { getYouTubeContentIdAndType } from "./utils"; // Self-referencing import, will be removed

export function getYouTubeContentIdAndType(url: string): { id: string | null, type: 'video' | 'playlist' | null } {
  // Regex for YouTube video IDs
  const videoRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
  const videoMatch = url.match(videoRegex);
  if (videoMatch && videoMatch[1]) {
    return { id: videoMatch[1], type: 'video' };
  }

  // Regex for YouTube playlist IDs
  const playlistRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/playlist\?list=([\w-]{34})(?:\S+)?/;
  const playlistMatch = url.match(playlistRegex);
  if (playlistMatch && playlistMatch[1]) {
    return { id: playlistMatch[1], type: 'playlist' };
  }

  return { id: null, type: null };
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const { id, type } = getYouTubeContentIdAndType(url);

  if (!id || !type) {
    return null;
  }

  // Common player parameters for background playback:
  // autoplay=1: Starts playing automatically
  // loop=1: Loops the video/playlist (requires playlist parameter for single videos)
  // controls=0: Hides player controls for custom UI
  // modestbranding=1: Shows a smaller YouTube logo
  // rel=0: Prevents showing related videos at the end
  // disablekb=1: Disables keyboard controls
  // fs=0: Disables the fullscreen button
  // iv_load_policy=3: Hides video annotations
  // enablejsapi=1: Enables JavaScript API for programmatic control
  // origin: Crucial for API to work, will be set by the player itself

  const commonParams = 'autoplay=1&loop=1&controls=0&modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1';

  if (type === 'video') {
    // For single videos, 'playlist' parameter with the same video ID is needed for looping.
    return `https://www.youtube.com/embed/${id}?${commonParams}&playlist=${id}`;
  } else if (type === 'playlist') {
    // For playlists, 'list' and 'listType' parameters are used.
    return `https://www.youtube.com/embed/videoseries?list=${id}&${commonParams}`;
  }

  return null;
}

export function getSpotifyEmbedUrl(url: string): string | null {
  const spotifyRegex = /https:\/\/open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)(?:\?.*)?/;
  const match = url.match(spotifyRegex);

  if (match && match[1] && match[2]) {
    const type = match[1];
    const id = match[2];
    // Spotify embed URLs typically follow this pattern.
    // We add 'utm_source=generator' as it's common for their embeds.
    // 'autoplay=1' is often supported but might be restricted by browser policies.
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&autoplay=1`;
  }
  return null;
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  let lastResult: any;
  let lastArgs: any[];
  let timeout: NodeJS.Timeout | null = null;

  return function(this: any, ...args: any[]) {
    const context = this;
    lastArgs = args;

    if (!inThrottle) {
      inThrottle = true;
      timeout = setTimeout(() => {
        inThrottle = false;
        timeout = null;
        if (lastArgs) { // If there were calls during the throttle period, execute the last one
          lastResult = func.apply(context, lastArgs);
          lastArgs = [];
        }
      }, limit);
      lastResult = func.apply(context, args);
    }
    return lastResult;
  } as T;
}