"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import { RoomData, RoomInvite, RoomMember } from "./rooms/types"; // Re-export types

export type { RoomData, RoomInvite, RoomMember }; // Re-export for external use

export function useRooms() {
  const { rooms, loading, fetchRooms } = useRoomFetching();
  const {
    handleCreateRoom,
    handleToggleRoomPublicStatus,
    handleToggleGuestWriteAccess,
    handleSetRoomPassword,
    handleDeleteRoom,
  } = useRoomManagement({ setRooms: (newRooms) => {}, fetchRooms });
  const {
    // handleGenerateInviteCode, // Removed as codes are now auto-generated on room creation
    handleJoinRoomByCode,
    handleJoinRoomByPassword,
    handleSendJoinRequest,
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
    // handleGenerateInviteCode, // Removed from export
    handleJoinRoomByCode,
    handleJoinRoomByPassword,
    handleSendJoinRequest,
    handleLeaveRoom,
    handleKickUser,
    fetchRooms, // Expose fetchRooms for manual refresh if needed
  };
}