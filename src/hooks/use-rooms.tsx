"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import type { RoomData, RoomInvite, RoomMember } from "./rooms/types";

export type { RoomData, RoomInvite, RoomMember };

export function useRooms() {
  const { rooms, setRooms, loading, fetchRooms } = useRoomFetching();
  const {
    handleCreateRoom,
    handleToggleRoomPublicStatus,
    handleToggleGuestWriteAccess,
    handleSetRoomPassword,
    handleDeleteRoom,
  } = useRoomManagement({ setRooms, fetchRooms });
  const {
    handleGenerateInviteCode,
    handleJoinRoomByCode,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
  } = useRoomMembership({ rooms, fetchRooms });

  return {
    rooms,
    loading,
    handleCreateRoom,
    handleToggleRoomPublicStatus,
    handleToggleGuestWriteAccess,
    handleSetRoomPassword,
    handleDeleteRoom,
    handleGenerateInviteCode,
    handleJoinRoomByCode,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
    fetchRooms,
  };
}