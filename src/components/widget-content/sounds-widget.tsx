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
  { name: "Rain Gutter", url: "/sounds/rain.mp3", category: "Rain & Water" },
  { name: "Ocean Waves", url: "/sounds/ocean.mp3", category: "Rain & Water" },
  { name: "Flowing River", url: "/sounds/river.mp3", category: "Rain & Water" },
  { name: "Gentle Rain", url: "/sounds/sound16.mp3", category: "Rain & Water" },
  { name: "Heavy Rain", url: "/sounds/sound17.mp3", category: "Rain & Water" },
  { name: "Thunderstorm", url: "/sounds/sound18.mp3", category: "Rain & Water" },
  { name: "Ocean Storm", url: "/sounds/sound21.mp3", category: "Rain & Water" },
  { name: "Mountain Stream", url: "/sounds/sound25.mp3", category: "Rain & Water" },
  { name: "Cave Dripping", url: "/sounds/sound26.mp3", category: "Rain & Water" },
  { name: "Underwater Bubbles", url: "/sounds/sound27.mp3", category: "Rain & Water" },
  { name: "Distant Thunder", url: "/sounds/thunder.mp3", category: "Rain & Water" },

  { name: "Forest Birds", url: "/sounds/forest.mp3", category: "Nature & Wind" },
  { name: "Gentle Wind", url: "/sounds/wind.mp3", category: "Nature & Wind" },
  { name: "Summer Night", url: "/sounds/sound13.mp3", category: "Nature & Wind" },
  { name: "Winter Wind", url: "/sounds/sound14.mp3", category: "Nature & Wind" },
  { name: "Light Breeze", url: "/sounds/sound19.mp3", category: "Nature & Wind" },
  { name: "Strong Wind", url: "/sounds/sound20.mp3", category: "Nature & Wind" },
  { name: "Forest Night", url: "/sounds/sound22.mp3", category: "Nature & Wind" },
  { name: "Jungle Sounds", url: "/sounds/sound23.mp3", category: "Nature & Wind" },
  { name: "Desert Wind", url: "/sounds/sound24.mp3", category: "Nature & Wind" },

  { name: "Busy Cafe", url: "/sounds/cafe.mp3", category: "Urban & Human" },
  { name: "City Ambience", url: "/sounds/city_ambience.mp3", category: "Urban & Human" },
  { name: "Distant City", url: "/sounds/sound15.mp3", category: "Urban & Human" },
  { name: "Distant Train", url: "/sounds/sound31.mp3", category: "Urban & Human" },

  { name: "Crackling Fireplace", url: "/sounds/fireplace.mp3", category: "Cozy & Abstract" },
  { name: "Space Ambience", url: "/sounds/sound28.mp3", category: "Cozy & Abstract" },
  { name: "Zen Garden", url: "/sounds/sound29.mp3", category: "Cozy & Abstract" },
  { name: "Cozy Fire", url: "/sounds/sound30.mp3", category: "Cozy & Abstract" },
  { name: "Calm River", url: "/sounds/sound12.mp3", category: "Cozy & Abstract" },

  { name: "White Noise", url: "/sounds/white_noise.ogg", category: "White Noise" },
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
    <div className="h-full w-full flex flex-col p-0"> {/* Removed Card, adjusted padding */}
      <div className="p-4 pb-2"> {/* Replaced CardHeader */}
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Music className="h-6 w-6" /> Ambient Sounds
        </h2>
      </div>
      <div className="p-4 pt-2 border-b border-border space-y-3"> {/* Replaced CardContent, adjusted padding */}
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
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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