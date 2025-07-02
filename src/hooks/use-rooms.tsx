"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import { RoomData, RoomInvite, RoomMember } from "./rooms/types";

export type { RoomData, RoomInvite, RoomMember };

export function useRooms() {
  const { rooms, loading, fetchRooms } = useRoomFetching();
  const {
    handleCreateRoom,
    handleToggleRoomPublicStatus,
    handleToggleGuestWriteAccess,
    handleSetRoomPassword,
    handleDeleteRoom,
  } = useRoomManagement({ setRooms: (newRooms) => {}, fetchRooms }); // Removed 'newRooms' as it was unused
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