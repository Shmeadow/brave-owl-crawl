"use client";

import React, { useState, useMemo } from "react";
import { Music, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AmbientSoundItem } from "@/components/ambient-sound-item";
import { Input } from "@/components/ui/input";
import { allAmbientSounds } from "@/lib/sounds"; // Import from the new central file

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSounds = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    if (!lowerCaseSearch) {
      return allAmbientSounds;
    }
    return allAmbientSounds.filter(sound =>
      sound.name.toLowerCase().includes(lowerCaseSearch) ||
      sound.category.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm]);

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
      </div>

      {filteredSounds.length === 0 ? (
        <p className="p-4 text-muted-foreground text-sm text-center">No ambient sounds found.</p>
      ) : (
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 grid gap-3 grid-cols-3 sm:grid-cols-4">
            {filteredSounds.map((sound) => (
              <AmbientSoundItem
                key={sound.url}
                name={sound.name}
                url={sound.url}
                icon={sound.icon}
                isCurrentRoomWritable={isCurrentRoomWritable}
              />
            ))}
          </div>
        </ScrollArea>
      )}
      <p className="text-sm text-muted-foreground mt-auto p-4 text-center border-t border-border">
        Click any sound to play. Multiple sounds can play simultaneously.
      </p>
    </div>
  );
}