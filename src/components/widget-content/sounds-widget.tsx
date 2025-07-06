"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, CloudRain, Wind, Coffee, Building, Volume2, Waves, Sun, Snowflake, BookOpen, Keyboard } from "lucide-react"; // Added more specific icons
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundItem } from "@/components/ambient-sound-item";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Categorized list of ambient sounds
// IMPORTANT: Ensure these files exist in your public/sounds/ directory!
// Supported formats typically include .mp3, .ogg, .wav
const allAmbientSounds = [
  // Nature Sounds
  { name: "Beach Ocean", url: "/sounds/beach_ocean.mp3", category: "Nature" },
  { name: "Rain", url: "/sounds/rain.mp3", category: "Nature" },
  { name: "Forest Birds", url: "/sounds/forest_birds.mp3", category: "Nature" },
  { name: "Thunderstorm", url: "/sounds/thunderstorm.mp3", category: "Nature" },
  { name: "River Flow", url: "/sounds/river_flow.mp3", category: "Nature" },
  { name: "Fireplace Crackle", url: "/sounds/fireplace_crackle.mp3", category: "Nature" },
  { name: "Ocean Waves", url: "/sounds/ocean_waves.mp3", category: "Nature" },
  { name: "Wind Chimes", url: "/sounds/wind_chimes.mp3", category: "Nature" },
  { name: "Thunder", url: "/sounds/thunder.mp3", category: "Nature" },

  // Cafe & City Sounds
  { name: "Coffee Shop", url: "/sounds/coffee_shop.mp3", category: "Cafe" },
  { name: "City Ambience", url: "/sounds/city_ambience.mp3", category: "City" },
  { name: "Train Ride", url: "/sounds/train_ride.mp3", category: "City" },
  { name: "City Traffic", url: "/sounds/city_traffic.mp3", category: "City" },
  { name: "Library Ambience", url: "/sounds/library_ambience.mp3", category: "City" },

  // Noise Sounds
  { name: "White Noise", url: "/sounds/white_noise.mp3", category: "Noise" },
  { name: "Brown Noise", url: "/sounds/brown_noise.mp3", category: "Noise" },
  { name: "Pink Noise", url: "/sounds/pink_noise.mp3", category: "Noise" },

  // Music & Abstract Sounds
  { name: "Lofi Beats", url: "/sounds/lofi_beats.mp3", category: "Music" },
  { name: "Calm Piano", url: "/sounds/calm_piano.mp3", category: "Music" },
  { name: "Space Ambience", url: "/sounds/space_ambience.mp3", category: "Abstract" },
  { name: "Zen Garden", url: "/sounds/zen_garden.mp3", category: "Abstract" },

  // Productivity Sounds
  { name: "Keyboard Typing", url: "/sounds/keyboard_typing.mp3", category: "Productivity" },
];

// Helper function to get a more specific icon based on sound name/category
const getSoundIcon = (name: string, category: string) => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();

  if (lowerCategory === 'nature') {
    if (lowerName.includes('rain') || lowerName.includes('thunderstorm') || lowerName.includes('thunder')) return <CloudRain className="h-5 w-5 text-primary" />;
    if (lowerName.includes('ocean') || lowerName.includes('beach') || lowerName.includes('river') || lowerName.includes('waves')) return <Waves className="h-5 w-5 text-primary" />;
    if (lowerName.includes('forest') || lowerName.includes('birds') || lowerName.includes('wind')) return <Wind className="h-5 w-5 text-primary" />;
  }
  if (lowerCategory === 'cafe') return <Coffee className="h-5 w-5 text-primary" />;
  if (lowerCategory === 'city') return <Building className="h-5 w-5 text-primary" />;
  if (lowerCategory === 'noise') return <Volume2 className="h-5 w-5 text-primary" />;
  if (lowerCategory === 'music') return <Music className="h-5 w-5 text-primary" />;
  if (lowerCategory === 'abstract') {
    if (lowerName.includes('space')) return <Sun className="h-5 w-5 text-primary" />;
    if (lowerName.includes('zen')) return <Snowflake className="h-5 w-5 text-primary" />;
  }
  if (lowerCategory === 'productivity') {
    if (lowerName.includes('keyboard')) return <Keyboard className="h-5 w-5 text-primary" />;
    return <BookOpen className="h-5 w-5 text-primary" />; // Generic for productivity
  }
  return <Music className="h-5 w-5 text-primary" />; // Default icon
};

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    const uniqueCategories = new Set(allAmbientSounds.map(sound => sound.category));
    return ["all", ...Array.from(uniqueCategories).sort()];
  }, []);

  const filteredSounds = useMemo(() => {
    let sounds = allAmbientSounds;

    if (selectedCategory !== "all") {
      sounds = sounds.filter(sound => sound.category === selectedCategory);
    }

    if (searchTerm) {
      sounds = sounds.filter(sound =>
        sound.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return sounds;
  }, [searchTerm, selectedCategory]);

  return (
    <div className="h-full w-full flex flex-col p-0">
      <div className="p-4 pb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Music className="h-6 w-6" /> Ambient Sounds
        </h2>
      </div>
      <div className="p-4 pt-2 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sounds..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="category-select" className="sr-only">Filter by Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-select">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(cat => cat !== "all").map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredSounds.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No ambient sounds found matching your criteria.</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 grid grid-cols-1 gap-4">
            {filteredSounds.map((sound) => (
              <AmbientSoundItem
                key={sound.url}
                name={sound.name}
                url={sound.url}
                isCurrentRoomWritable={isCurrentRoomWritable}
                category={sound.category}
              />
            ))}
          </div>
        </ScrollArea>
      )}
      <p className="text-sm text-muted-foreground mt-auto p-4 text-center border-t border-border">
        Click play on any sound to start. Multiple sounds can play simultaneously.
      </p>
    </div>
  );
}