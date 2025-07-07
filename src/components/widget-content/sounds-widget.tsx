"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, CloudRain, Wind, Coffee, Building, Volume2, Waves, Sun, Snowflake, BookOpen, Keyboard, Bird, Flame, Footprints, Leaf } from "lucide-react"; // Removed Frog icon
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundItem } from "@/components/ambient-sound-item";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Categorized list of ambient sounds
// IMPORTANT: Ensure these files exist in your public/sound/ directory!
// Supported formats typically include .mp3, .ogg, .wav
const allAmbientSounds = [
  // Nature Sounds (based on provided filenames)
  { name: "Blackbird", url: "/sound/birdblackbird.ogg", category: "Nature" },
  { name: "Crow", url: "/sound/birdcrow.ogg", category: "Nature" },
  { name: "Nightingale", url: "/sound/birdnightingale.ogg", category: "Nature" },
  { name: "Calm Fire", url: "/sound/firecalm.ogg", category: "Nature" },
  { name: "Fire Crackling", url: "/sound/firecrackling.ogg", category: "Nature" },
  { name: "Gravel Footsteps", url: "/sound/footstepsgravel.ogg", category: "Nature" },
  { name: "Eerie Forest", url: "/sound/foresteerie.ogg", category: "Nature" },
  { name: "Evening Forest", url: "/sound/forestevening.ogg", category: "Nature" },
  { name: "Frog Chorus", url: "/sound/frogchorus.ogg", category: "Nature" },
  { name: "Cricket Frog", url: "/sound/frogcricket.ogg", category: "Nature" },
  { name: "Natterjack Frog", url: "/sound/frognatterjack.ogg", category: "Nature" },
  { name: "Wood Frog", url: "/sound/frogwood.ogg", category: "Nature" },
  { name: "Rustling Leaves", url: "/sound/leaves.ogg", category: "Nature" },
];

// Helper function to get a more specific icon based on sound name/category
const getSoundIcon = (name: string, category: string) => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();

  if (lowerCategory === 'nature') {
    if (lowerName.includes('bird')) return <Bird className="h-5 w-5 text-primary" />;
    if (lowerName.includes('fire')) return <Flame className="h-5 w-5 text-primary" />;
    if (lowerName.includes('footsteps')) return <Footprints className="h-5 w-5 text-primary" />;
    if (lowerName.includes('forest')) return <Wind className="h-5 w-5 text-primary" />;
    if (lowerName.includes('frog')) return <Leaf className="h-5 w-5 text-primary" />; // Replaced Frog with Leaf
    if (lowerName.includes('leaves')) return <Leaf className="h-5 w-5 text-primary" />;
  }
  // Keep existing icons for categories that might be added later or are generic
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
        <div>
          <Label htmlFor="category-select" className="sr-only">Filter by Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-select">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="z-[1003]"> {/* Added z-[1003] here */}
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(cat => cat !== "all").map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sounds..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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