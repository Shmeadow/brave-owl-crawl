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

  const recalculatePinnedWidgets = useCallback((currentWidgets: WidgetState[]) => {
    let currentX = mainContentArea.left + DOCKED_WIDGET_HORIZONTAL_GAP;

    return currentWidgets.map((widget: WidgetState) => {
      if (widget.isPinned) {
        const newPosition = {
          x: currentX,
          y: mainContentArea.top + mainContentArea.height - DOCKED_WIDGET_HEIGHT - BOTTOM_DOCK_OFFSET,
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
  }, [mainContentArea]);

  // Load state from Supabase or local storage on mount/auth change
  useEffect(() => {
    if (authLoading || !mounted.current || mainContentArea.width === 0) return; // Wait for mainContentArea to be valid

    const loadWidgetStates = async () => {
      setLoading(true);
      let loadedWidgetStates: WidgetState[] = [];

      if (session && supabase) {
        setIsLoggedInMode(true);
        // 1. Try to fetch from Supabase
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
          // 2. If no Supabase data, check local storage for migration
          const savedState = localStorage.getItem(LOCAL_STORAGE_WIDGET_STATE_KEY);
          if (savedState) {
            try {
              const parsedState: WidgetState[] = JSON.parse(savedState);
              const validWidgets = parsedState.filter((w: WidgetState) => initialWidgetConfigs[w.id]);
              
              // Migrate to Supabase
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
            // 3. If neither, start with empty state (new user)
            loadedWidgetStates = [];
          }
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        // For guests, always start with an empty screen, ignoring local storage.
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
            isClosed: existingState.isClosed || false, // Ensure isClosed is set, default to false if undefined
          };
        } else {
          // Default state for widgets not found in persistence (closed by default)
          return {
            id,
            title: id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), // Basic title from ID
            position: clampPosition(config.initialPosition.x, config.initialPosition.y, config.initialWidth, config.initialHeight, mainContentArea),
            size: { width: config.initialWidth, height: config.initialHeight },
            zIndex: 903, // Base zIndex
            isMinimized: false,
            isMaximized: false,
            isPinned: false,
            isClosed: true, // New widgets are closed by default
            normalPosition: clampPosition(config.initialPosition.x, config.initialPosition.y, config.initialWidth, config.initialHeight, mainContentArea),
            normalSize: { width: config.initialWidth, height: config.initialHeight },
          };
        }
      });
      
      setActiveWidgets(recalculatePinnedWidgets(allWidgets));
      setLoading(false);
    };

    loadWidgetStates();
  }, [session, supabase, authLoading, initialWidgetConfigs, mainContentArea, recalculatePinnedWidgets]);

  // Save state to Supabase or local storage whenever activeWidgets changes
  const isInitialSaveLoad = useRef(true); // Use a different ref for saving
  useEffect(() => {
    if (isInitialSaveLoad.current) {
      isInitialSaveLoad.current = false;
      return;
    }

    if (!mounted.current || loading) return; // Don't save if not mounted or still loading

    const saveWidgetStates = async () => {
      if (isLoggedInMode && session && supabase) {
        // Delete existing states for this user and insert new ones
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
          } else {
            // toast.success("Widget layout saved to your account!"); // Too frequent, removed
          }
        }
      } else {
        // For guests, do not save the layout to local storage to ensure a clean start.
      }
    };

    const debounceSave = setTimeout(() => {
      saveWidgetStates();
    }, 500); // Debounce saves to avoid too many writes

    return () => clearTimeout(debounceSave);
  }, [activeWidgets, isLoggedInMode, session, supabase, loading, mounted]);

  return { activeWidgets, setActiveWidgets, loading, isLoggedInMode };
}