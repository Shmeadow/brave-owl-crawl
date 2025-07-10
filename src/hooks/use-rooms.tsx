"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import { RoomData, RoomMember } from "./rooms/types"; // Re-export types

export type { RoomData, RoomMember }; // Re-export for external use

export function useRooms() {
  const { rooms, loading, fetchRooms, setRooms } = useRoomFetching(); // Get setRooms from useRoomFetching
  const {
    handleCreateRoom,
    handleSendRoomInvitation, // Renamed and updated
    handleDeleteRoom,
    handleUpdateRoomType, // Exposed
    handleSetRoomPassword, // Exposed
    handleUpdateRoomDescription, // Exposed
    handleUpdateRoomBackground, // Exposed
  } = useRoomManagement({ setRooms, fetchRooms }); // Pass setRooms to useRoomManagement
  const {
    handleJoinRoomByRoomId,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
    handleAcceptInvitation, // New
    handleRejectInvitation, // New
  } = useRoomMembership({ rooms, fetchRooms });

  return {
    rooms,
    loading,
    handleCreateRoom,
    handleSendRoomInvitation, // New function
    handleDeleteRoom,
    handleUpdateRoomType, // Exposed
    handleSetRoomPassword, // Exposed
    handleUpdateRoomDescription, // Exposed
    handleUpdateRoomBackground, // Exposed
    handleJoinRoomByRoomId,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
    handleAcceptInvitation, // New
    handleRejectInvitation, // New
    fetchRooms, // Expose fetchRooms for manual refresh if needed
  };
}