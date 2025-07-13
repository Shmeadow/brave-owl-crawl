"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import { useRoomJoinRequests } from "./rooms/use-room-join-requests";
import { RoomData, RoomMember } from "./rooms/types"; // Corrected import path
import { useSupabase } from "@/integrations/supabase/auth";
import { useCurrentRoom } from "./use-current-room"; // Import useCurrentRoom

export type { RoomData, RoomMember }; // Re-export for external use

export function useRooms() {
  const { rooms, loading, fetchRooms, setRooms } = useRoomFetching();
  const { refreshProfile } = useSupabase();
  const { setCurrentRoom } = useCurrentRoom(); // Get setCurrentRoom

  const {
    handleCreateRoom,
    handleSendRoomInvitation,
    handleDeleteRoom,
    handleUpdateRoomType,
    handleSetRoomPassword,
    handleUpdateRoomDescription,
    handleUpdateRoomBackground,
    handleUpdateRoomName,
  } = useRoomManagement({ setRooms, fetchRooms, refreshProfile, setCurrentRoom }); // Pass setCurrentRoom

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