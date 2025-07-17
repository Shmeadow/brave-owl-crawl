"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import {
  WidgetState,
  DbWidgetState,
  MainContentArea,
  WidgetConfig,
  LOCAL_STORAGE_WIDGET_STATE_KEY,
  clampPosition,
  toDbWidgetState,
  fromDbWidgetState,
  DOCKED_WIDGET_WIDTH,
  DOCKED_WIDGET_HEIGHT,
  DOCKED_WIDGET_HORIZONTAL_GAP,
  BOTTOM_DOCK_OFFSET,
  DEFAULT_WIDGET_WIDTH_MOBILE, // Import new constants
  DEFAULT_WIDGET_HEIGHT_MOBILE, // Import new constants
} from './types';
import { useCurrentRoom } from "../use-current-room";

interface UseWidgetPersistenceProps {
  initialWidgetConfigs: { [key: string]: WidgetConfig };
  mainContentArea: MainContentArea;
  isMobile: boolean; // New prop
  isCurrentRoomWritable: boolean; // New prop
}

export function useWidgetPersistence({ initialWidgetConfigs, mainContentArea, isMobile, isCurrentRoomWritable }: UseWidgetPersistenceProps) {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [activeWidgets, setActiveWidgets] = useState<WidgetState[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const mounted = useRef(false);
  const hasLoadedForSession = useRef<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const recalculatePinnedWidgets = useCallback((currentWidgets: WidgetState[]) => {
    let currentX = mainContentArea.left + DOCKED_WIDGET_HORIZONTAL_GAP;
    return currentWidgets.map((widget: WidgetState) => {
      if (widget.isPinned) {
        const newPosition = {
          x: currentX,
          y: mainContentArea.top + mainContentArea.height - DOCKED_WIDGET_HEIGHT - BOTTOM_DOCK_OFFSET,
        };
        currentX += DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP;
        return { ...widget, position: newPosition, size: { width: DOCKED_WIDGET_WIDTH, height: DOCKED_WIDGET_HEIGHT }, isMinimized: true, isMaximized: false, isClosed: false };
      }
      return widget;
    });
  }, [mainContentArea]);

  // Memoize loadWidgetStates itself
  const loadWidgetStates = useCallback(async () => {
    if (authLoading || !mounted.current) return;

    const sessionId = session?.user?.id || 'guest';
    const contextId = currentRoomId || sessionId;
    if (contextId === hasLoadedForSession.current) return;

    setLoading(true);
    hasLoadedForSession.current = contextId;
    let loadedWidgetStates: WidgetState[] = [];

    if (session && supabase) {
      setIsLoggedInMode(true);
      if (currentRoomId) {
        const { data: roomWidgets, error } = await supabase.from('user_widget_states').select('*').eq('room_id', currentRoomId);
        if (error) {
          toast.error("Failed to load room widget layout.");
        } else if (roomWidgets) {
          const latestStates = new Map<string, DbWidgetState>();
          for (const widget of roomWidgets) {
            const existing = latestStates.get(widget.widget_id);
            if (!existing || new Date(widget.updated_at) > new Date(existing.updated_at)) {
              latestStates.set(widget.widget_id, widget);
            }
          }
          loadedWidgetStates = Array.from(latestStates.values()).map(fromDbWidgetState);
        }
      } else {
        // If not in a room, load personal widgets for the logged-in user
        const { data: personalWidgets, error } = await supabase.from('user_widget_states').select('*').eq('user_id', session.user.id).is('room_id', null);
        if (error) toast.error("Failed to load personal widget layout.");
        else if (personalWidgets) loadedWidgetStates = personalWidgets.map(fromDbWidgetState);
      }
    } else {
      // Guest mode
      setIsLoggedInMode(false);
      // In guest mode, we don't persist across sessions, so we start fresh.
      // The initialWidgetConfigs will provide the default state.
      loadedWidgetStates = [];
      localStorage.removeItem(LOCAL_STORAGE_WIDGET_STATE_KEY); // Clear any old local storage states
    }

    const allWidgets: WidgetState[] = Object.keys(initialWidgetConfigs).map(id => {
      const config = initialWidgetConfigs[id];
      const existingState = loadedWidgetStates.find(w => w.id === id);

      const effectiveInitialWidth = isMobile ? DEFAULT_WIDGET_WIDTH_MOBILE : config.initialWidth;
      const effectiveInitialHeight = isMobile ? DEFAULT_WIDGET_HEIGHT_MOBILE : config.initialHeight;

      if (existingState) {
        const clampedPos = clampPosition(existingState.position.x, existingState.position.y, existingState.size.width, existingState.size.height, mainContentArea);
        return { ...existingState, position: clampedPos, normalPosition: existingState.normalPosition || clampedPos };
      }
      return {
        id, title: id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        position: clampPosition(config.initialPosition.x, config.initialPosition.y, effectiveInitialWidth, effectiveInitialHeight, mainContentArea),
        size: { width: effectiveInitialWidth, height: effectiveInitialHeight },
        zIndex: 903, isMinimized: false, isMaximized: false, isPinned: false, isClosed: true,
        normalPosition: clampPosition(config.initialPosition.x, config.initialPosition.y, effectiveInitialWidth, effectiveInitialHeight, mainContentArea),
        normalSize: { width: effectiveInitialWidth, height: effectiveInitialHeight },
      };
    });
    
    setActiveWidgets(recalculatePinnedWidgets(allWidgets));
    setLoading(false);
  }, [
    authLoading,
    session,
    supabase,
    currentRoomId,
    initialWidgetConfigs,
    isMobile,
    mainContentArea,
    recalculatePinnedWidgets,
    // Removed setActiveWidgets, setLoading, setIsLoggedInMode from dependencies
  ]);

  useEffect(() => {
    loadWidgetStates();
  }, [loadWidgetStates]); // This useEffect is correct.

  useEffect(() => {
    if (!mounted.current || loading) return;
    const saveWidgetStates = async () => {
      // Only save if the current room is writable OR if it's the personal dashboard (currentRoomId is null)
      // And only if there's a session (logged-in mode)
      if (isLoggedInMode && session && supabase && (isCurrentRoomWritable || currentRoomId === null)) {
        const statesToSave = activeWidgets.map((w: WidgetState) => toDbWidgetState(w, session.user.id, currentRoomId));
        if (statesToSave.length > 0) {
          // Determine the onConflict target based on currentRoomId
          // For personal dashboard (currentRoomId === null), use the specific partial unique index name.
          // For room-specific widgets (currentRoomId !== null), use the composite unique key.
          const onConflictTarget = currentRoomId === null
            ? 'user_widget_states_user_id_widget_id_null_room_id_key' // Explicit constraint name for NULL room_id
            : 'user_id,widget_id,room_id'; // Composite key for non-null room_id

          console.log("Attempting to upsert widget states with onConflict target:", onConflictTarget, "for room ID:", currentRoomId);
          const { error } = await supabase.from('user_widget_states').upsert(statesToSave, { onConflict: onConflictTarget });
          if (error) {
            console.error("Supabase error saving widget layout:", error);
            toast.error("Failed to save widget layout. Check console for details.");
          }
        }
      }
    };
    const debounceSave = setTimeout(saveWidgetStates, 1000);
    return () => clearTimeout(debounceSave);
  }, [activeWidgets, isLoggedInMode, session, supabase, loading, mounted, currentRoomId, isCurrentRoomWritable]);

  useEffect(() => {
    if (!currentRoomId || !supabase) return;
    const channel = supabase.channel(`room-widgets-${currentRoomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_widget_states', filter: `room_id=eq.${currentRoomId}` },
        (payload) => {
          if ((payload.new as DbWidgetState)?.user_id === session?.user?.id) return;
          
          const processPayload = (dbWidget: DbWidgetState) => {
            const widgetState = fromDbWidgetState(dbWidget);
            setActiveWidgets(prev => {
              const existingIndex = prev.findIndex(w => w.id === widgetState.id);
              if (existingIndex > -1) {
                const newWidgets = [...prev];
                newWidgets[existingIndex] = { ...newWidgets[existingIndex], ...widgetState };
                return recalculatePinnedWidgets(newWidgets);
              }
              return recalculatePinnedWidgets([...prev, widgetState]);
            });
          };

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            processPayload(payload.new as DbWidgetState);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRoomId, supabase, session?.user?.id, setActiveWidgets, recalculatePinnedWidgets]);

  return { activeWidgets, setActiveWidgets, loading, isLoggedInMode };
}