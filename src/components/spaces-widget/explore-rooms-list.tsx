"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoomData } from "@/hooks/use-rooms";
import { RoomListItem } from "./room-list-item";

interface ExploreRoomsListProps {
  publicRooms: RoomData[];
}

export function ExploreRoomsList({ publicRooms }: ExploreRoomsListProps) {
  return (
    <Card className="w-full bg-background/50 backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Explore Public Rooms</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-3">
            {publicRooms.map((room) => (
              <RoomListItem key={room.id} room={room} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}