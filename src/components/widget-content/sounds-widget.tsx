"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundItem } from "@/components/ambient-sound-item";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Categorized list of ambient sounds
export const allAmbientSounds = [
  { name: "Beach Ocean", url: "/sounds/beach_ocean.mp3", category: "Nature & Water" },
  { name: "Rain", url: "/sounds/rain.mp3", category: "Nature & Water" },
  { name: "Forest Birds", url: "/sounds/forest_birds.mp3", category: "Nature & Water" },
  { name: "Thunderstorm", url: "/sounds/thunderstorm.mp3", category: "Nature & Water" },
  { name: "River Flow", url: "/sounds/river_flow.mp3", category: "Nature & Water" },
  { name: "Wind Chimes", url: "/sounds/wind_chimes.mp3", category: "Nature & Water" },
  { name: "Campfire", url: "/sounds/campfire.mp3", category: "Nature & Water" },
  { name: "White Noise", url: "/sounds/white_noise.mp3", category: "Noise" },
  { name: "Brown Noise", url: "/sounds/brown_noise.mp3", category: "Noise" },
  { name: "Pink Noise", url: "/sounds/pink_noise.mp3", category: "Noise" },
  { name: "Cafe Ambience", url: "/sounds/cafe_ambience.mp3", category: "Urban" },
  { name: "City Rain", url: "/sounds/city_rain.mp3", category: "Urban" },
  { name: "Train Ride", url: "/sounds/train_ride.mp3", category: "Urban" },
  { name: "Space Ambience", url: "/sounds/space_ambience.mp3", category: "Sci-Fi & Fantasy" },
  { name: "Fantasy Forest", url: "/sounds/fantasy_forest.mp3", category: "Sci-Fi & Fantasy" },
  { name: "Zen Garden", url: "/sounds/zen_garden.mp3", category: "Relaxation" },
];

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    const uniqueCategories = new Set(allAmbientSounds.map(sound => sound.category));
    return ["all", ...Array.from(uniqueCategories)].sort();
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
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
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