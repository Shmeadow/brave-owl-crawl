"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, CloudRain, Wind, Coffee, Building, Volume2, Waves, Sun, Snowflake, BookOpen, Keyboard, Bird, Flame, Footprints, Leaf, Droplet, WavesIcon, TrainFront, Cloud, TreePine, Bug, Moon, Speaker } from "lucide-react"; // Added more specific icons
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundItem } from "@/components/ambient-sound-item";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider"; // Import Slider

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Categorized list of ambient sounds
// IMPORTANT: Ensure these files exist in your public/sound/ directory!
// Supported formats typically include .mp3, .ogg, .wav
const allAmbientSounds = [
  // Birds
  { name: "Blackbird", url: "/sound/birdblackbird.ogg", category: "Birds" },
  { name: "Crow", url: "/sound/birdcrow.ogg", category: "Birds" },
  { name: "Nightingale", url: "/sound/birdnightingale.ogg", category: "Birds" },
  // Fire
  { name: "Calm Fire", url: "/sound/firecalm.ogg", category: "Fire" },
  { name: "Fire Crackling", url: "/sound/firecrackling.ogg", category: "Fire" },
  // Footsteps
  { name: "Gravel Footsteps", url: "/sound/footstepsgravel.ogg", category: "Footsteps" },
  // Forest
  { name: "Eerie Forest", url: "/sound/foresteerie.ogg", category: "Forest" },
  { name: "Evening Forest", url: "/sound/forestevening.ogg", category: "Forest" },
  // Frogs
  { name: "Frog Chorus", url: "/sound/frogchorus.ogg", category: "Frogs" },
  { name: "Cricket Frog", url: "/sound/frogcricket.ogg", category: "Frogs" },
  { name: "Natterjack Frog", url: "/sound/frognatterjack.ogg", category: "Frogs" },
  { name: "Wood Frog", url: "/sound/frogwood.ogg", category: "Frogs" },
  // Leaves
  { name: "Rustling Leaves", url: "/sound/leaves.ogg", category: "Leaves" },
  // Night
  { name: "Night Meadow", url: "/sound/nightmeadow.ogg", category: "Night" },
  { name: "Night Suburban", url: "/sound/nightsuburban.ogg", category: "Night" },
  // Rain
  { name: "Dense Rain", url: "/sound/raindense.ogg", category: "Rain" },
  { name: "Rain Dripping", url: "/sound/raindripping.ogg", category: "Rain" },
  { name: "Rain Gutter", url: "/sound/raingutter.ogg", category: "Rain" },
  { name: "Rain Porch", url: "/sound/rainporch.ogg", category: "Rain" },
  { name: "Rain Shack", url: "/sound/rainshack.ogg", category: "Rain" },
  // Restaurant
  { name: "English Restaurant", url: "/sound/restaurantenglish.ogg", category: "Cafe" },
  // River
  { name: "Calm River", url: "/sound/rivercalm.ogg", category: "River" },
  { name: "Strong River", url: "/sound/riverstrong.ogg", category: "River" },
  // Thunder
  { name: "Thunder", url: "/sound/thunder.ogg", category: "Weather" },
  // Train
  { name: "Fast Train", url: "/sound/trainfast.ogg", category: "City" },
  { name: "Slow Train", url: "/sound/trainslow.ogg", category: "City" },
  // Waves
  { name: "Beach Waves", url: "/sound/wavesbeach.ogg", category: "Ocean" },
  { name: "Slow Waves", url: "/sound/wavesslow.ogg", category: "Ocean" },
  // Wind
  { name: "Howling Wind", url: "/sound/windhowling.ogg", category: "  Wind" },
  { name: "Steady Wind", url: "/sound/windsteady.ogg", category: "Wind" },
  // Noise
  { name: "White Noise", url: "/sound/noisewhite.ogg", category: "Noise" },
];

// Helper function to get a more specific icon based on sound name/category
const getSoundIcon = (name: string, category: string) => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();

  switch (lowerCategory) {
    case 'birds': return <Bird className="h-5 w-5 text-primary" />;
    case 'fire': return <Flame className="h-5 w-5 text-primary" />;
    case 'footsteps': return <Footprints className="h-5 w-5 text-primary" />;
    case 'forest': return <TreePine className="h-5 w-5 text-primary" />;
    case 'frogs': return <Bug className="h-5 w-5 text-primary" />; // Using Bug for frogs
    case 'leaves': return <Leaf className="h-5 w-5 text-primary" />;
    case 'night': return <Moon className="h-5 w-5 text-primary" />;
    case 'rain': return <Droplet className="h-5 w-5 text-primary" />;
    case 'cafe': return <Coffee className="h-5 w-5 text-primary" />;
    case 'river': return <WavesIcon className="h-5 w-5 text-primary" />;
    case 'weather': return <Cloud className="h-5 w-5 text-primary" />; // For thunder
    case 'city': return <TrainFront className="h-5 w-5 text-primary" />; // For trains
    case 'ocean': return <Waves className="h-5 w-5 text-primary" />;
    case 'wind': return <Wind className="h-5 w-5 text-primary" />;
    case 'noise': return <Speaker className="h-5 w-5 text-primary" />; // For white noise
    default: return <Music className="h-5 w-5 text-primary" />; // Default icon
  }
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
            <SelectContent className="z-[1003]">
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
          <div className="p-4 grid gap-4 grid-cols-2"> {/* Fixed to 2 columns */}
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