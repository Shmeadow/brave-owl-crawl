"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoomData } from "@/hooks/use-rooms";
import { RoomListItem } from "./room-list-item";

interface MyRoomsListProps {
  myRooms: RoomData[];
}

export function MyRoomsList({ myRooms }: MyRoomsListProps) {
  if (myRooms.length === 0) {
    return (
      <div className="w-full text-center">
        <p className="text-muted-foreground">You haven't created or joined any rooms yet.</p>
      </div>
    );
  }

  return (
    <Card className="w-full bg-background/50 backdrop-blur-xl border-white/20 p-2 sm:p-4">
      <CardHeader className="p-0 pb-2 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">Your Rooms</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px] pr-2 sm:pr-4">
          <div className="space-y-3">
            {myRooms.map((room) => (
              <RoomListItem key={room.id} room={room} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}