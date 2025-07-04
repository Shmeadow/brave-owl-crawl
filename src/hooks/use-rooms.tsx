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
  } = useRoomManagement({ setRooms: (newRooms) => {}, fetchRooms }); // Pass a dummy setRooms, as fetchRooms will update the state in useRoomFetching
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
    fetchRooms, // Expose fetchRooms for manual refresh if needed
  };
}