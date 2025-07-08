"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import { RoomData, RoomMember } from "./rooms/types";

export type { RoomData, RoomMember };

export function useRooms() {
  const { rooms, loading, fetchRooms } = useRoomFetching();
  const {
    handleCreateRoom,
    handleAddRoomMember,
    handleDeleteRoom,
  } = useRoomManagement({ fetchRooms });
  const {
    handleJoinRoomByRoomId,
    handleLeaveRoom,
    handleKickUser,
  } = useRoomMembership({ rooms, fetchRooms });

  return {
    rooms,
    loading,
    handleCreateRoom,
    handleAddRoomMember,
    handleDeleteRoom,
    handleJoinRoomByRoomId,
    handleLeaveRoom,
    handleKickUser,
    fetchRooms,
  };
}