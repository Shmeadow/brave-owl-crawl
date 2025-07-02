"use client";

import { useRoomFetching, useRoomManagement, useRoomMembership, RoomData, RoomInvite, RoomMember } from "./rooms";

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