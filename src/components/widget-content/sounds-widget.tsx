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
const allAmbientSounds = [
  { name: "Beach Ocean", url: "/sounds/beach_ocean.mp3", category: "Nature" },
  { name: "Rain", url: "/sounds/rain.mp3", category: "Nature" },
  { name: "Forest Birds", url: "/sounds/forest_birds.mp3", category: "Nature" },
  { name: "Thunderstorm", url: "/sounds/thunderstorm.mp3", category: "Nature" },
  { name: "River Flow", url: "/sounds/river_flow.mp3", category: "Nature" },
  { name: "Coffee Shop", url: "/sounds/coffee_shop.mp3", category: "Cafe" },
  { name: "City Ambience", url: "/sounds/city_ambience.mp3", category: "City" },
  { name: "Train Ride", url: "/sounds/train_ride.mp3", category: "City" },
  { name: "White Noise", url: "/sounds/white_noise.mp3", category: "Noise" },
  { name: "Brown Noise", url: "/sounds/brown_noise.mp3", category: "Noise" },
  { name: "Pink Noise", url: "/sounds/pink_noise.mp3", category: "Noise" },
  { name: "Lofi Beats", url: "/sounds/lofi_beats.mp3", category: "Music" },
  { name: "Calm Piano", url: "/sounds/calm_piano.mp3", category: "Music" },
  { name: "Space Ambience", url: "/sounds/space_ambience.mp3", category: "Abstract" },
  { name: "Zen Garden", url: "/sounds/zen_garden.mp3", category: "Abstract" },
];

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