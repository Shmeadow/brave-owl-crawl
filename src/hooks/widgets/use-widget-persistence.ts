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
} from './types'; // Corrected import path

interface UseWidgetPersistenceProps {
  initialWidgetConfigs: { [key: string]: WidgetConfig };
  mainContentArea: MainContentArea;
}

export function useWidgetPersistence({ initialWidgetConfigs, mainContentArea }: UseWidgetPersistenceProps) {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [activeWidgets, setActiveWidgets] = useState<WidgetState[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Helper to recalculate positions of pinned widgets
  const recalculatePinnedWidgets = useCallback((currentWidgets: WidgetState[], area: MainContentArea) => {
    let currentX = area.left + DOCKED_WIDGET_HORIZONTAL_GAP;

    return currentWidgets.map((widget: WidgetState) => {
      if (widget.isPinned) {
        const newPosition = {
          x: currentX,
          y: area.top + area.height - DOCKED_WIDGET_HEIGHT - BOTTOM_DOCK_OFFSET,
        };
        currentX += DOCKED_WIDGET_WIDTH + DOCKED_WIDGET_HORIZONTAL_GAP;

        return {
          ...widget,
          position: newPosition,
          size: {
            width: DOCKED_WIDGET_WIDTH,
            height: DOCKED_WIDGET_HEIGHT,
          },
          isMinimized: true,
          isMaximized: false,
          isClosed: false, // Pinned widgets are always visible
        };
      }
      return widget;
    });
  }, []);

  // Effect for initial loading of widget states (runs once or on session change)
  useEffect(() => {
    if (authLoading || !mounted.current || mainContentArea.width === 0) return; // Wait for mainContentArea to be valid for initial clamping

    const loadWidgetStates = async () => {
      setLoading(true);
      let loadedWidgetStates: WidgetState[] = [];

      if (session && supabase) {
        setIsLoggedInMode(true);
        const { data: supabaseWidgets, error: fetchError } = await supabase
          .from('user_widget_states')
          .select('*')
          .eq('user_id', session.user.id);

        if (fetchError) {
          console.error("Error fetching widget states from Supabase:", fetchError);
          toast.error("Failed to load widget states.");
        }

        if (supabaseWidgets && supabaseWidgets.length > 0) {
          loadedWidgetStates = supabaseWidgets.map((w: DbWidgetState) => fromDbWidgetState(w)).filter((w: WidgetState) => initialWidgetConfigs[w.id]);
        } else {
          const savedState = localStorage.getItem(LOCAL_STORAGE_WIDGET_STATE_KEY);
          if (savedState) {
            try {
              const parsedState: WidgetState[] = JSON.parse(savedState);
              const validWidgets = parsedState.filter((w: WidgetState) => initialWidgetConfigs[w.id]);
              
              const { error: insertError } = await supabase
                .from('user_widget_states')
                .insert(validWidgets.map((w: WidgetState) => toDbWidgetState(w, session.user.id)));

              if (insertError) {
                console.error("Error migrating local widget states to Supabase:", insertError);
                toast.error("Error migrating local widget settings.");
              } else {
                loadedWidgetStates = validWidgets;
                localStorage.removeItem(LOCAL_STORAGE_WIDGET_STATE_KEY);
              }
            } catch (e) {
              console.error("Error parsing local storage widget states:", e);
              loadedWidgetStates = [];
            }
          } else {
            loadedWidgetStates = [];
          }
        }
      } else {
        setIsLoggedInMode(false);
        // For guests, always start with an empty screen, ignoring local storage.
        // This ensures a clean slate for guest users on every visit.
        loadedWidgetStates = [];
        localStorage.removeItem(LOCAL_STORAGE_WIDGET_STATE_KEY); // Clear any previous guest state
      }

      // Initialize all widgets based on initialWidgetConfigs, marking them as closed by default
      const allWidgets: WidgetState[] = Object.keys(initialWidgetConfigs).map(id => {
        const config = initialWidgetConfigs[id];
        const existingState = loadedWidgetStates.find(w => w.id === id);

        if (existingState) {
          // Clamp positions for existing widgets
          const clampedCurrentPos = clampPosition(
            existingState.position.x,
            existingState.position.y,
            existingState.size.width,
            existingState.size.height,
            mainContentArea
          );
          const clampedNormalPos = existingState.normalPosition ? clampPosition(
            existingState.normalPosition.x,
            existingState.normalPosition.y,
            existingState.normalSize?.width || config.initialWidth,
            existingState.normalSize?.height || config.initialHeight,
            mainContentArea
          ) : clampedCurrentPos;

          return {
            ...existingState,
            position: clampedCurrentPos,
            normalPosition: clampedNormalPos,
            isClosed: existingState.isClosed || false,
          };
        } else {
          return {
            id,
            title: id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            position: clampPosition(config.initialPosition.x, config.initialPosition.y, config.initialWidth, config.initialHeight, mainContentArea),
            size: { width: config.initialWidth, height: config.initialHeight },
            zIndex: 903,
            isMinimized: false,
            isMaximized: false,
            isPinned: false,
            isClosed: true, // New widgets are closed by default
            normalPosition: clampPosition(config.initialPosition.x, config.initialPosition.y, config.initialWidth, config.initialHeight, mainContentArea),
            normalSize: { width: config.initialWidth, height: config.initialHeight },
          };
        }
      });
      
      setActiveWidgets(recalculatePinnedWidgets(allWidgets, mainContentArea));
      setLoading(false);
    };

    loadWidgetStates();
  }, [session, supabase, authLoading, initialWidgetConfigs, mounted, mainContentArea, recalculatePinnedWidgets]); // Added mainContentArea here for initial clamping

  // Effect to re-clamp and re-position widgets when mainContentArea changes
  useEffect(() => {
    if (!mounted.current || loading || mainContentArea.width === 0) return;

    setActiveWidgets(prevWidgets => {
      const updatedWidgets = prevWidgets.map(widget => {
        // Only re-clamp floating widgets (not maximized or pinned)
        if (!widget.isMaximized && !widget.isPinned) {
          const clampedPos = clampPosition(
            widget.position.x,
            widget.position.y,
            widget.size.width,
            widget.size.height,
            mainContentArea
          );
          return { ...widget, position: clampedPos, normalPosition: clampedPos };
        } else if (widget.isMaximized) {
          // Maximized widgets always fill the mainContentArea
          return {
            ...widget,
            position: { x: mainContentArea.left, y: mainContentArea.top },
            size: { width: mainContentArea.width, height: mainContentArea.height },
          };
        }
        return widget;
      });
      // Recalculate pinned widgets after clamping
      return recalculatePinnedWidgets(updatedWidgets, mainContentArea);
    });
  }, [mainContentArea, mounted, loading, recalculatePinnedWidgets]);


  // Save state to Supabase or local storage whenever activeWidgets changes
  const isInitialSaveLoad = useRef(true);
  useEffect(() => {
    if (isInitialSaveLoad.current) {
      isInitialSaveLoad.current = false;
      return;
    }

    if (!mounted.current || loading) return;

    const saveWidgetStates = async () => {
      if (isLoggedInMode && session && supabase) {
        const { error: deleteError } = await supabase
          .from('user_widget_states')
          .delete()
          .eq('user_id', session.user.id);

        if (deleteError) {
          console.error("Error clearing old widget states:", deleteError);
          toast.error("Failed to save widget layout.");
          return;
        }

        if (activeWidgets.length > 0) {
          const { error: insertError } = await supabase
            .from('user_widget_states')
            .insert(activeWidgets.map((w: WidgetState) => toDbWidgetState(w, session.user.id)));

          if (insertError) {
            console.error("Error saving widget states to Supabase:", insertError);
            toast.error("Failed to save widget layout.");
          }
        }
      } else {
        // For guests, do not save the layout to local storage to ensure a clean start.
      }
    };

    const debounceSave = setTimeout(() => {
      saveWidgetStates();
    }, 500);

    return () => clearTimeout(debounceSave);
  }, [activeWidgets, isLoggedInMode, session, supabase, loading, mounted]);

  return { activeWidgets, setActiveWidgets, loading, isLoggedInMode };
}