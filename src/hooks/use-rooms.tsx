"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import { RoomData, RoomMember } from "./rooms/types"; // Re-export types

export type { RoomData, RoomMember }; // Re-export for external use

export function useRooms() {
  const { rooms, loading, fetchRooms } = useRoomFetching();
  const {
    handleCreateRoom,
    handleAddRoomMember, // New function
    handleDeleteRoom,
  } = useRoomManagement({ setRooms: (newRooms) => {}, fetchRooms }); // Pass a dummy setRooms, as fetchRooms will update the state in useRoomFetching
  const {
    handleJoinRoomByRoomId,
    handleLeaveRoom,
    handleKickUser,
  } = useRoomMembership({ rooms, fetchRooms });

  return {
    rooms,
    loading,
    handleCreateRoom,
    handleAddRoomMember, // New function
    handleDeleteRoom,
    handleJoinRoomByRoomId,
    handleLeaveRoom,
    handleKickUser,
    fetchRooms, // Expose fetchRooms for manual refresh if needed
  };
}