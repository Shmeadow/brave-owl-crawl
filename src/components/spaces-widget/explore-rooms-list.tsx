"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoomData } from "@/hooks/use-rooms";
import { RoomListItem } from "./room-list-item";

interface ExploreRoomsListProps {
  publicRooms: RoomData[];
}

export function ExploreRoomsList({ publicRooms }: ExploreRoomsListProps) {
  return (
    <div>
      <h4 className="text-base sm:text-md font-semibold mb-2">Public Rooms</h4>
      {publicRooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center p-2 sm:p-4">
          No public rooms to explore right now.
        </p>
      ) : (
        <ScrollArea className="max-h-[250px] pr-2 sm:pr-4">
          <div className="space-y-3">
            {publicRooms.map((room) => (
              <RoomListItem key={room.id} room={room} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}