"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import { useRoomJoinRequests } from "./rooms/use-room-join-requests";
import { RoomData, RoomMember } from "./rooms/types";
import { useSupabase } from "@/integrations/supabase/auth";

export type { RoomData, RoomMember }; // Re-export for external use

export function useRooms() {
  const { rooms, loading, fetchRooms, setRooms } = useRoomFetching();
  const { refreshProfile } = useSupabase();

  const {
    handleCreateRoom,
    handleSendRoomInvitation,
    handleDeleteRoom,
    handleUpdateRoomType,
    handleSetRoomPassword,
    handleUpdateRoomDescription,
    handleUpdateRoomBackground,
    handleUpdateRoomName,
  } = useRoomManagement({ rooms, setRooms, fetchRooms, refreshProfile });

  const {
    handleJoinRoomByRoomId,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
  } = useRoomMembership({ rooms, fetchRooms });

  const {
    pendingRequests,
    acceptRequest,
    declineRequest,
    dismissRequest,
  } = useRoomJoinRequests({ rooms });

  return {
    rooms,
    loading,
    handleCreateRoom,
    handleSendRoomInvitation,
    handleDeleteRoom,
    handleUpdateRoomType,
    handleSetRoomPassword,
    handleUpdateRoomDescription,
    handleUpdateRoomBackground,
    handleUpdateRoomName,
    handleJoinRoomByRoomId,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
    fetchRooms,
    pendingRequests,
    acceptRequest,
    declineRequest,
    dismissRequest,
  };
}