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
} from './types';

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
    if (authLoading || !mounted.current) return;

    const currentSessionId = session?.user?.id || 'guest';
    if (currentSessionId === hasLoadedForSession.current) return;

    const loadWidgetStates = async () => {
      setLoading(true);
      hasLoadedForSession.current = currentSessionId;
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
                .upsert(validWidgets.map((w: WidgetState) => toDbWidgetState(w, session.user.id)), { onConflict: 'user_id,widget_id' });

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
        loadedWidgetStates = [];
        localStorage.removeItem(LOCAL_STORAGE_WIDGET_STATE_KEY);
      }

      const allWidgets: WidgetState[] = Object.keys(initialWidgetConfigs).map(id => {
        const config = initialWidgetConfigs[id];
        const existingState = loadedWidgetStates.find(w => w.id === id);

        if (existingState) {
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
            isClosed: true,
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

  const isInitialSaveLoad = useRef(true);
  useEffect(() => {
    if (isInitialSaveLoad.current) {
      isInitialSaveLoad.current = false;
      return;
    }

    if (!mounted.current || loading) return;

    const saveWidgetStates = async () => {
      if (isLoggedInMode && session && supabase && activeWidgets.length > 0) {
        const dbStates = activeWidgets.map((w: WidgetState) => toDbWidgetState(w, session.user.id));
        const { error } = await supabase
          .from('user_widget_states')
          .upsert(dbStates, { onConflict: 'user_id,widget_id' });

        if (error) {
          console.error("Error saving widget states:", error.message, error.details);
          toast.error("Failed to save widget layout.");
        }
      }
    };

    const debounceSave = setTimeout(() => {
      saveWidgetStates();
    }, 1000); // Increased debounce to 1s to reduce save frequency

    return () => clearTimeout(debounceSave);
  }, [activeWidgets, isLoggedInMode, session, supabase, loading, mounted]);

  return { activeWidgets, setActiveWidgets, loading, isLoggedInMode };
}