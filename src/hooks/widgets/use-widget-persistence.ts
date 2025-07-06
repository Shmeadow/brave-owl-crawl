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
          const loadedWidgets = supabaseWidgets.map((w: DbWidgetState) => fromDbWidgetState(w)).filter((w: WidgetState) => initialWidgetConfigs[w.id]);
          const reClampedWidgets = loadedWidgets.map((widget: WidgetState) => {
            const clampedPos = clampPosition(
              widget.position.x,
              widget.position.y,
              widget.size.width,
              widget.size.height,
              mainContentArea
            );
            return {
              ...widget,
              position: clampedPos,
              normalPosition: widget.normalPosition ? clampPosition(
                widget.normalPosition.x,
                widget.normalPosition.y,
                widget.normalSize?.width || initialWidgetConfigs[widget.id].initialWidth,
                widget.normalSize?.height || initialWidgetConfigs[widget.id].initialHeight,
                mainContentArea
              ) : clampedPos,
            };
          });
          setActiveWidgets(reClampedWidgets); // Pinned widgets will be recalculated after this
          console.log("Loaded widget states from Supabase.");
        } else {
          // 2. If no Supabase data, check local storage for migration
          const savedState = localStorage.getItem(LOCAL_STORAGE_WIDGET_STATE_KEY);
          if (savedState) {
            try {
              const parsedState: WidgetState[] = JSON.parse(savedState);
              const validWidgets = parsedState.filter((w: WidgetState) => initialWidgetConfigs[w.id]);
              const reClampedWidgets = validWidgets.map((widget: WidgetState) => {
                const clampedPos = clampPosition(
                  widget.position.x,
                  widget.position.y,
                  widget.size.width,
                  widget.size.height,
                  mainContentArea
                );
                return {
                  ...widget,
                  position: clampedPos,
                  normalPosition: widget.normalPosition ? clampPosition(
                    widget.normalPosition.x,
                    widget.normalPosition.y,
                    widget.normalSize?.width || initialWidgetConfigs[widget.id].initialWidth,
                    widget.normalSize?.height || initialWidgetConfigs[widget.id].initialHeight,
                    mainContentArea
                  ) : clampedPos,
                };
              });

              // Migrate to Supabase
              const { error: insertError } = await supabase
                .from('user_widget_states')
                .insert(reClampedWidgets.map((w: WidgetState) => toDbWidgetState(w, session.user.id)));

              if (insertError) {
                console.error("Error migrating local widget states to Supabase:", insertError);
                toast.error("Error migrating local widget settings.");
              } else {
                setActiveWidgets(reClampedWidgets); // Pinned widgets will be recalculated after this
                localStorage.removeItem(LOCAL_STORAGE_WIDGET_STATE_KEY);
                toast.success("Local widget settings migrated to your account!");
              }
            } catch (e) {
              console.error("Error parsing local storage widget states:", e);
              setActiveWidgets([]);
            }
          } else {
            // 3. If neither, start with empty state (new user)
            setActiveWidgets([]);
          }
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const savedState = localStorage.getItem(LOCAL_STORAGE_WIDGET_STATE_KEY);
        if (savedState) {
          try {
            const parsedState: WidgetState[] = JSON.parse(savedState);
            const validWidgets = parsedState.filter((w: WidgetState) => initialWidgetConfigs[w.id]);
            const reClampedWidgets = validWidgets.map((widget: WidgetState) => {
              const clampedPos = clampPosition(
                widget.position.x,
                widget.position.y,
                widget.size.width,
                widget.size.height,
                mainContentArea
              );
              return {
                ...widget,
                position: clampedPos,
                normalPosition: widget.normalPosition ? clampPosition(
                  widget.normalPosition.x,
                  widget.normalPosition.y,
                  widget.normalSize?.width || initialWidgetConfigs[widget.id].initialWidth,
                  widget.normalSize?.height || initialWidgetConfigs[widget.id].initialHeight,
                  mainContentArea
                ) : clampedPos,
              };
            });
            setActiveWidgets(reClampedWidgets); // Pinned widgets will be recalculated after this
          } catch (e) {
            console.error("Error parsing local storage widget states:", e);
            setActiveWidgets([]);
          }
        } else {
          setActiveWidgets([]);
        }
      }
      setLoading(false);
    };

    loadWidgetStates();
  }, [session, supabase, authLoading, initialWidgetConfigs, mainContentArea, recalculatePinnedWidgets]);

  // Apply pinned widget recalculation after activeWidgets are set
  useEffect(() => {
    if (!loading && activeWidgets.length > 0 && mainContentArea.width > 0) {
      setActiveWidgets(prev => recalculatePinnedWidgets(prev));
    }
  }, [loading, activeWidgets.length, mainContentArea, recalculatePinnedWidgets]);


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
            // toast.success("Widget layout saved to your account!"); // Too frequent
          }
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_WIDGET_STATE_KEY, JSON.stringify(activeWidgets));
        // toast.success("Widget layout saved locally!"); // Too frequent
      }
    };

    const debounceSave = setTimeout(() => {
      saveWidgetStates();
    }, 500); // Debounce saves to avoid too many writes

    return () => clearTimeout(debounceSave);
  }, [activeWidgets, isLoggedInMode, session, supabase, loading, mounted]);

  return { activeWidgets, setActiveWidgets, loading, isLoggedInMode };
}