"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward, Rewind, Music, Link } from 'lucide-react';

const SimpleAudioPlayer = () => {
  // State variables for player controls and information
  const [isPlaying, setIsPlaying] = useState(false); // Whether the audio is currently playing
  const [volume, setVolume] = useState(0.7); // Current volume level (0 to 1)
  const [isMuted, setIsMuted] = useState(false); // Whether the audio is muted
  const [currentTime, setCurrentTime] = useState(0); // Current playback time in seconds
  const [duration, setDuration] = useState(0); // Total duration of the audio in seconds
  const [audioUrl, setAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // Default audio URL
  const [audioTitle, setAudioTitle] = useState('SoundHelix Song 1'); // Default audio title
  const [audioArtist, setAudioArtist] = useState('SoundHelix'); // Default audio artist
  const [showUrlInput, setShowUrlInput] = useState(false); // Toggle for showing URL input

  // Ref to the HTML audio element
  const audioRef = useRef<HTMLAudioElement>(null);
  // Ref to store the previous volume before muting
  const prevVolumeRef = useRef(volume);

  // Effect to handle play/pause based on isPlaying state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Effect to manage volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Function to format time from seconds to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Event handler for when audio metadata is loaded
  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  // Event handler for time updates during playback
  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Event handler for when audio ends
  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0); // Reset current time
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset audio element's current time
    }
  }, []);

  // Function to toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  // Function to handle volume change from slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false); // Unmute if volume is increased from 0
      prevVolumeRef.current = newVolume; // Update previous volume
    } else {
      setIsMuted(true); // Mute if volume is set to 0
    }
  };

  // Function to toggle mute
  const toggleMute = () => {
    if (isMuted) {
      // If currently muted, unmute to the previous volume
      setVolume(prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.7); // Use 0.7 if prevVolume was 0
      setIsMuted(false);
    } else {
      // If not muted, store current volume and then mute
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Function to handle progress bar click/drag
  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Function to skip forward by 10 seconds
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Function to skip backward by 10 seconds
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Function to load new audio from URL input
  const loadNewAudio = () => {
    if (audioRef.current) {
      audioRef.current.load(); // Reload the audio element with the new URL
      setIsPlaying(false); // Pause playback initially
      setCurrentTime(0);
      setDuration(0);
      setShowUrlInput(false); // Hide input after loading
    }
  };

  return (
    <div className="fixed right-4 z-[1000] top-20">
      <div className="bg-card backdrop-blur-xl border-white/20 p-1 rounded-lg shadow-sm max-w-[16rem] w-full">

        {/* Audio element - hidden but controls playback */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          preload="metadata" // Preload metadata to get duration faster
        >
          Your browser does not support the audio element.
        </audio>

        {/* Main Player Row: Album Art, Track Info, Controls */}
        <div className="flex items-center justify-between space-x-1.5 mb-1">
          {/* Album Art Placeholder */}
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shadow-xs">
            <Music size={24} />
          </div>

          {/* Track Info and URL Input Toggle */}
          <div className="flex-grow min-w-0">
            <p className="text-[0.7rem] font-semibold text-gray-700 truncate leading-tight">{audioTitle}</p>
            <p className="text-[0.6rem] text-gray-600 truncate">{audioArtist}</p>
            <button
              onClick={() => setShowUrlInput(prev => !prev)}
              className="text-xs font-bold text-blue-600 hover:underline mt-0.5 flex items-center"
              title="Change Music URL"
            >
              <Link size={12} className="mr-0.5" />
              {showUrlInput ? 'Hide URL' : 'Embed URL'}
            </button>
          </div>

          {/* Playback Controls and Volume */}
          <div className="flex items-center space-x-0.5 flex-shrink-0">
            <button
              onClick={skipBackward}
              className="p-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition duration-300"
              aria-label="Skip backward 10 seconds"
              title="Skip Backward"
            >
              <Rewind size={12} />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-1 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition duration-300 shadow-xs transform hover:scale-105"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={skipForward}
              className="p-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition duration-300"
              aria-label="Skip forward 10 seconds"
              title="Skip Forward"
            >
              <FastForward size={12} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-0.5 ml-1">
              <button
                onClick={toggleMute}
                className="p-0.5 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition duration-300"
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX size={10} /> : <Volume2 size={10} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-8 h-[0.15rem] bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-500"
                style={{
                  background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${(isMuted ? 0 : volume) * 100}%, #d1d5db ${(isMuted ? 0 : volume) * 100}%, #d1d5db 100%)`
                }}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar and Time */}
        <div className="flex items-center space-x-1 mb-1">
          <span className="text-[0.55rem] text-gray-600 w-6 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleProgressBarChange}
            className="w-full h-[0.15rem] bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-500"
            style={{
              background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${(currentTime / duration) * 100}%, #d1d5db ${(currentTime / duration) * 100}%, #d1d5db 100%)`
            }}
          />
          <span className="text-[0.55rem] text-gray-600 w-6 text-left">{formatTime(duration)}</span>
        </div>

        {/* URL Input Section */}
        {showUrlInput && (
          <div className="mt-1 p-1 bg-muted rounded-lg border border-border">
            <label htmlFor="audio-url" className="block text-[0.6rem] font-medium text-muted-foreground mb-0.5">
              Embed URL:
            </label>
            <input
              type="text"
              id="audio-url"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="e.g., song.mp3"
              className="w-full p-0.5 text-[0.6rem] border border-border rounded-md focus:ring-primary focus:border-primary mb-0.5 bg-background text-foreground placeholder-muted-foreground"
            />
            <label htmlFor="audio-title" className="block text-[0.6rem] font-medium text-muted-foreground mb-0.5">
              Title:
            </label>
            <input
              type="text"
              id="audio-title"
              value={audioTitle}
              onChange={(e) => setAudioTitle(e.target.value)}
              placeholder="e.g., My Song"
              className="w-full p-0.5 text-[0.6rem] border border-border rounded-md focus:ring-primary focus:border-primary mb-0.5 bg-background text-foreground placeholder-muted-foreground"
            />
            <label htmlFor="audio-artist" className="block text-[0.6rem] font-medium text-muted-foreground mb-0.5">
              Artist:
            </label>
            <input
              type="text"
              id="audio-artist"
              value={audioArtist}
              onChange={(e) => setAudioArtist(e.target.value)}
              placeholder="e.g., Artist Name"
              className="w-full p-0.5 text-[0.6rem] border border-border rounded-md focus:ring-primary focus:border-primary mb-1 bg-background text-foreground placeholder-muted-foreground"
            />
            <button
              onClick={loadNewAudio}
              className="w-full bg-primary text-primary-foreground text-[0.6rem] py-0.5 px-1 rounded-md hover:bg-primary/90 transition duration-300 shadow-xs"
            >
              Load Music
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { SimpleAudioPlayer };