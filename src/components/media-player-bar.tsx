"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, Youtube, Music, Minus, ChevronLeft, SkipBack, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useMediaPlayer } from '@/components/media-player-context';
import { toast } from "sonner";
import { AudioPlayer } from "@/components/audio-player"; // Import AudioPlayer

export function MediaPlayerBar() {
  const {
    activePlayer,
    youtubeEmbedUrl,
    spotifyEmbedUrl,
    localAudioPlaylist,
    currentLocalAudioIndex,
    setLocalAudioPlaylist, // Keep this for internal logic if needed, but not exposed via button
    setCurrentLocalAudioIndex, // Keep this for internal logic if needed, but not exposed via button
    setActivePlayer,
  } = useMediaPlayer();

  const {
    isPlaying: isYouTubePlaying,
    volume: youtubeVolume,
    isMuted: isYouTubeMuted,
    togglePlayPause: toggleYouTubePlayPause,
    setVolume: setYouTubeVolume,
    toggleMute: toggleYouTubeMute,
    playerReady: youTubePlayerReady,
    currentTime: youtubeCurrentTime,
    duration: youtubeDuration,
    videoTitle: youtubeVideoTitle,
    formatTime: formatYouTubeTime,
    iframeContainerRef: youtubeIframeContainerRef,
  } = useYouTubePlayer(youtubeEmbedUrl);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLocalAudioPlaying, setIsLocalAudioPlaying] = useState(false);
  const [localAudioCurrentTime, setLocalAudioCurrentTime] = useState(0);
  const [localAudioDuration, setLocalAudioDuration] = useState(0);
  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(false);
  const [localAudioVolume, setLocalAudioVolumeState] = useState(0.6); // Default volume for local audio

  const [isMinimized, setIsMinimized] = useState(false);

  // Determine if the bar should be visible at all
  const isBarVisible = youtubeEmbedUrl !== null || spotifyEmbedUrl !== null || (localAudioPlaylist && localAudioPlaylist.length > 0);

  // Sync local audio player state with context
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => {
      setLocalAudioDuration(audio.duration);
    };

    const updateProgressUI = () => {
      setLocalAudioCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (localAudioPlaylist && localAudioPlaylist.length > 0) {
        const nextIndex = (currentLocalAudioIndex + 1) % localAudioPlaylist.length;
        setCurrentLocalAudioIndex(nextIndex);
        // Audio element's src will be updated by the next useEffect, then it will play
      }
    };

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('timeupdate', updateProgressUI);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('timeupdate', updateProgressUI);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [localAudioPlaylist, currentLocalAudioIndex, setCurrentLocalAudioIndex]);

  // Load track when currentLocalAudioIndex changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && localAudioPlaylist && localAudioPlaylist.length > 0) {
      audio.src = localAudioPlaylist[currentLocalAudioIndex].src;
      audio.load();
      if (isLocalAudioPlaying && activePlayer === 'local-audio') {
        audio.play().catch(e => console.error("Error playing local audio:", e));
      }
    }
  }, [localAudioPlaylist, currentLocalAudioIndex, isLocalAudioPlaying, activePlayer]);

  // Control local audio play/pause based on activePlayer
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activePlayer === 'local-audio') {
      if (!isLocalAudioPlaying) {
        audio.play().catch(e => console.error("Error playing local audio:", e));
        setIsLocalAudioPlaying(true);
      }
    } else {
      if (isLocalAudioPlaying) {
        audio.pause();
        setIsLocalAudioPlaying(false);
      }
    }
  }, [activePlayer, isLocalAudioPlaying]);

  const toggleLocalAudioPlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isLocalAudioPlaying) {
        audio.pause();
        toast.info("Local audio paused.");
      } else {
        audio.play().catch(e => {
          console.error("Error playing local audio:", e);
          toast.error("Failed to play local audio. Browser autoplay policy might be blocking it.");
        });
        toast.success("Local audio playing.");
      }
      setIsLocalAudioPlaying(!isLocalAudioPlaying);
      setActivePlayer('local-audio');
    }
  }, [isLocalAudioPlaying, setActivePlayer]);

  const setLocalAudioVolume = useCallback((value: number[]) => {
    const vol = value[0];
    const audio = audioRef.current;
    if (audio) {
      audio.volume = vol;
      setLocalAudioVolumeState(vol);
      setIsLocalAudioMuted(vol === 0);
    }
  }, []);

  const toggleLocalAudioMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setIsLocalAudioMuted(audio.muted);
      if (!audio.muted && audio.volume === 0) {
        audio.volume = 0.6;
        setLocalAudioVolumeState(0.6);
      } else if (audio.muted) {
        setLocalAudioVolumeState(0);
      } else {
        setLocalAudioVolumeState(audio.volume);
      }
    }
  }, []);

  const handleLocalAudioNext = useCallback(() => {
    if (localAudioPlaylist && localAudioPlaylist.length > 0) {
      const nextIndex = (currentLocalAudioIndex + 1) % localAudioPlaylist.length;
      setCurrentLocalAudioIndex(nextIndex);
      setActivePlayer('local-audio');
      toast.info(`Now playing: ${localAudioPlaylist[nextIndex].title}`);
    }
  }, [localAudioPlaylist, currentLocalAudioIndex, setCurrentLocalAudioIndex, setActivePlayer]);

  const handleLocalAudioPrevious = useCallback(() => {
    if (localAudioPlaylist && localAudioPlaylist.length > 0) {
      const prevIndex = (currentLocalAudioIndex === 0 ? localAudioPlaylist.length - 1 : currentLocalAudioIndex - 1);
      setCurrentLocalAudioIndex(prevIndex);
      setActivePlayer('local-audio');
      toast.info(`Now playing: ${localAudioPlaylist[prevIndex].title}`);
    }
  }, [localAudioPlaylist, currentLocalAudioIndex, setCurrentLocalAudioIndex, setActivePlayer]);

  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  }, []);

  if (!isBarVisible) {
    return null;
  }

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const currentTrackTitle = localAudioPlaylist && localAudioPlaylist.length > 0
    ? localAudioPlaylist[currentLocalAudioIndex]?.title
    : "No track";
  const currentTrackArtist = localAudioPlaylist && localAudioPlaylist.length > 0
    ? localAudioPlaylist[currentLocalAudioIndex]?.artist
    : "";
  const currentTrackCover = localAudioPlaylist && localAudioPlaylist.length > 0
    ? localAudioPlaylist[currentLocalAudioIndex]?.cover
    : "/placeholder-music.png"; // Placeholder image

  return (
    <Card
      className={cn(
        "fixed right-4 z-[1000]",
        "bg-card border-white/20 shadow-lg rounded-lg",
        "flex flex-col px-4 py-2 transition-all duration-300 ease-in-out",
        "backdrop-blur-2xl", // Stronger blur
        isMinimized
          ? "w-12 h-12 top-1/2 -translate-y-1/2 items-center justify-center cursor-pointer" // Minimized state
          : "w-80 h-auto top-20" // Expanded state
      )}
      onClick={isMinimized ? handleToggleMinimize : undefined} // Expand on click when minimized
    >
      {isMinimized ? (
        // Minimized state content
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Expand Media Player</span>
        </Button>
      ) : (
        // Expanded state content
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-semibold text-foreground">Media Player</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleToggleMinimize} title="Minimize Media Player">
                <Minus className="h-4 w-4" />
                <span className="sr-only">Minimize Media Player</span>
              </Button>
            </div>
          </div>

          {/* Player Selector */}
          <div className="flex gap-2 mb-4">
            {youtubeEmbedUrl && (
              <Button
                variant={activePlayer === 'youtube' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivePlayer('youtube')}
                className="flex-1"
              >
                <Youtube className="h-4 w-4 mr-1" /> YouTube
              </Button>
            )}
            {spotifyEmbedUrl && (
              <Button
                variant={activePlayer === 'spotify' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivePlayer('spotify')}
                className="flex-1"
              >
                <Music className="h-4 w-4 mr-1" /> Spotify
              </Button>
            )}
            {localAudioPlaylist && localAudioPlaylist.length > 0 && (
              <Button
                variant={activePlayer === 'local-audio' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivePlayer('local-audio')}
                className="flex-1"
              >
                <Music className="h-4 w-4 mr-1" /> Local
              </Button>
            )}
          </div>

          {/* Conditional Player Rendering */}
          {activePlayer === 'youtube' && youtubeEmbedUrl && (
            <CardContent className="relative z-10 flex flex-col justify-between h-full p-0">
              {/* YouTube Player Iframe Container (hidden but active) */}
              <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                <div
                  ref={youtubeIframeContainerRef}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[100vw] min-h-[100vh] max-w-none max-h-none"
                  style={{ transform: 'scale(2)' }} // Zoom in to hide controls and branding
                >
                  {/* The YouTube API will inject the iframe here */}
                </div>
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 flex flex-col text-sm text-foreground">
                <span className="font-semibold truncate">{youtubeVideoTitle}</span>
                <span className="text-xs text-muted-foreground">
                  {youTubePlayerReady ? `${formatYouTubeTime(youtubeCurrentTime)} / ${formatYouTubeTime(youtubeDuration)}` : "0:00 / 0:00"}
                </span>
              </div>

              <div className="flex items-center gap-4 w-full mt-2">
                <Button
                  onClick={toggleYouTubePlayPause}
                  disabled={!youTubePlayerReady}
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                >
                  {isYouTubePlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    onClick={toggleYouTubeMute}
                    disabled={!youTubePlayerReady}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    {isYouTubeMuted || youtubeVolume === 0 ? <VolumeX className="h-5 w-5 text-muted-foreground" /> : <Volume2 className="h-5 w-5 text-muted-foreground" />}
                    <span className="sr-only">{isYouTubeMuted ? "Unmute" : "Mute"}</span>
                  </Button>
                  <Slider
                    value={[youtubeVolume]}
                    max={100}
                    step={1}
                    onValueChange={([val]) => setYouTubeVolume(val)}
                    disabled={!youTubePlayerReady}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          )}

          {activePlayer === 'spotify' && spotifyEmbedUrl && (
            <CardContent className="relative z-10 flex flex-col justify-between h-full p-0">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
                <iframe
                  src={spotifyEmbedUrl}
                  width="100%"
                  height="100%"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="absolute top-0 left-0 w-full h-full rounded-md"
                  title="Spotify Player"
                ></iframe>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                (Use controls within the player for playback and volume)
              </p>
            </CardContent>
          )}

          {activePlayer === 'local-audio' && localAudioPlaylist && localAudioPlaylist.length > 0 && (
            <CardContent className="relative z-10 flex flex-col justify-between h-full p-0">
              <audio ref={audioRef} preload="metadata"></audio>
              <div className="flex items-center gap-2 mb-2">
                <img src={currentTrackCover} alt="Cover" className="w-12 h-12 rounded-md object-cover" />
                <div className="flex flex-col text-sm text-foreground flex-1 truncate">
                  <span className="font-semibold truncate">{currentTrackTitle}</span>
                  <span className="text-xs text-muted-foreground truncate">{currentTrackArtist}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-muted-foreground">{formatTime(localAudioCurrentTime)}</span>
                <Slider
                  value={[localAudioCurrentTime]}
                  max={localAudioDuration}
                  step={1}
                  onValueChange={([val]) => {
                    if (audioRef.current) audioRef.current.currentTime = val;
                    setLocalAudioCurrentTime(val);
                  }}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground">{formatTime(localAudioDuration)}</span>
              </div>

              <div className="flex items-center justify-center gap-2 w-full mt-2">
                <Button onClick={handleLocalAudioPrevious} size="icon" variant="ghost">
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button onClick={toggleLocalAudioPlayPause} size="icon" className="h-10 w-10">
                  {isLocalAudioPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button onClick={handleLocalAudioNext} size="icon" variant="ghost">
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button
                  onClick={toggleLocalAudioMute}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  {isLocalAudioMuted || localAudioVolume === 0 ? <VolumeX className="h-5 w-5 text-muted-foreground" /> : <Volume2 className="h-5 w-5 text-muted-foreground" />}
                  <span className="sr-only">{isLocalAudioMuted ? "Unmute" : "Mute"}</span>
                </Button>
                <Slider
                  value={[localAudioVolume]}
                  max={1}
                  step={0.01}
                  onValueChange={setLocalAudioVolume}
                  className="w-20"
                />
              </div>
            </CardContent>
          )}

          {!activePlayer && (youtubeEmbedUrl || spotifyEmbedUrl || (localAudioPlaylist && localAudioPlaylist.length > 0)) && (
            <CardContent className="text-center text-muted-foreground text-sm p-0">
              Select a player above to activate.
            </CardContent>
          )}
        </>
      )}
    </Card>
  );
}