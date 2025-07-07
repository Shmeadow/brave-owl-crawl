"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

interface UsePersistentDataOptions<T_APP_DATA, T_DB_DATA_ITEM> {
  localStorageKey: string;
  supabaseTableName: string;
  initialValue: T_APP_DATA;
  selectQuery?: string; // e.g., '*' or 'id, name'
  transformFromDb?: T_APP_DATA extends Array<infer U> // If T_APP_DATA is an array
    ? (dbData: T_DB_DATA_ITEM[]) => T_APP_DATA // then transformFromDb expects an array of DB items
    : (dbData: T_DB_DATA_ITEM) => T_APP_DATA; // otherwise, it expects a single DB item
  transformToDb?: (
    appItem: T_APP_DATA extends Array<infer U> ? U : T_APP_DATA, // Extracts item type if T_APP_DATA is an array
    userId: string
  ) => T_DB_DATA_ITEM; // Returns single DB item
  onConflictColumn?: string; // Column for Supabase upsert onConflict (e.g., 'user_id' or 'id')
  userIdColumn?: string; // Column name for user_id in DB table (e.g., 'user_id')
  debounceDelay?: number; // Delay for debounced saving to Supabase
  isSingleton?: boolean; // If the data is a single row per user (e.g., preferences, settings)
}

export function usePersistentData<T_APP_DATA, T_DB_DATA_ITEM>(options: UsePersistentDataOptions<T_APP_DATA, T_DB_DATA_ITEM>) {
  const {
    localStorageKey,
    supabaseTableName,
    initialValue,
    selectQuery = '*',
    transformFromDb = (data: any) => data as T_APP_DATA,
    transformToDb = (data: any, userId: string) => data as T_DB_DATA_ITEM, // Default transformToDb
    onConflictColumn,
    userIdColumn = 'user_id',
    debounceDelay = 500,
    isSingleton = false,
  } = options;

  const { supabase, session, loading: authLoading } = useSupabase();
  const [data, setDataState] = useState<T_APP_DATA>(initialValue);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (authLoading || !isMounted.current) return;

    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      let fetchedData: T_APP_DATA | null = null;

      // 1. Fetch from Supabase
      let query: any = supabase.from(supabaseTableName).select(selectQuery); // Added `as any`
      if (userIdColumn && session.user.id) {
        query = query.eq(userIdColumn, session.user.id);
      }
      if (isSingleton) {
        query = query.single();
      }

      const { data: dbData, error: fetchError } = await query;

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error(`Error fetching data from ${supabaseTableName}:`, fetchError);
        toast.error(`Failed to load ${supabaseTableName} data.`);
      }

      if (dbData) {
        fetchedData = transformFromDb(dbData as any); // Cast to any here, as the specific type is handled by the conditional type
      }

      // 2. If no Supabase data, check local storage for migration
      if (!fetchedData || (Array.isArray(fetchedData) && fetchedData.length === 0)) {
        const localDataString = localStorage.getItem(localStorageKey);
        if (localDataString) {
          try {
            const parsedLocalData = JSON.parse(localDataString);
            // Attempt to migrate to Supabase
            const dataToInsert = isSingleton
              ? transformToDb(parsedLocalData, session.user.id)
              : (Array.isArray(parsedLocalData) ? parsedLocalData.map((item: any) => transformToDb(item, session.user.id)) : []);

            const { error: insertError } = await supabase
              .from(supabaseTableName)
              .upsert(dataToInsert, { onConflict: onConflictColumn || userIdColumn }); // Use onConflictColumn if provided, else userIdColumn

            if (insertError) {
              console.error(`Error migrating local data to ${supabaseTableName}:`, insertError);
              toast.error(`Error migrating local ${supabaseTableName} settings.`);
            } else {
              fetchedData = parsedLocalData; // Use local data as source of truth after successful migration
              localStorage.removeItem(localStorageKey);
              // toast.success(`Local ${supabaseTableName} migrated to your account!`); // Removed for cleaner logs
            }
          } catch (e) {
            console.error(`Error parsing local storage for ${localStorageKey}:`, e);
          }
        }
      }

      setDataState(fetchedData || initialValue);

    } else {
      // User is a guest (not logged in)
      setIsLoggedInMode(false);
      const storedDataString = localStorage.getItem(localStorageKey);
      try {
        setDataState(storedDataString ? JSON.parse(storedDataString) : initialValue);
      } catch (e) {
        console.error(`Error parsing local storage for ${localStorageKey}:`, e);
        setDataState(initialValue);
      }
    }
    setLoading(false);
  }, [authLoading, session, supabase, localStorageKey, supabaseTableName, selectQuery, transformFromDb, transformToDb, onConflictColumn, userIdColumn, initialValue, isSingleton]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setData = useCallback((newValue: T_APP_DATA | ((prev: T_APP_DATA) => T_APP_DATA)) => {
    setDataState(prev => {
      const finalValue = typeof newValue === 'function' ? (newValue as (prev: T_APP_DATA) => T_APP_DATA)(prev) : newValue;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (isLoggedInMode && session && supabase && session.user.id) {
          const dataToSave = isSingleton
            ? transformToDb(finalValue as any, session.user.id) // Cast to any for transformToDb input
            : (Array.isArray(finalValue) ? finalValue.map((item: any) => transformToDb(item, session.user.id)) : transformToDb(finalValue as any, session.user.id));

          // For lists, we need to handle inserts/updates/deletes more granularly.
          // This generic hook will only handle upserting the entire dataset for simplicity.
          // More complex list management (add/delete/update individual items) should be done
          // in the specific hooks that use this, by calling `fetchData` after their mutations.
          if (isSingleton) {
            const { error } = await supabase
              .from(supabaseTableName)
              .upsert(dataToSave, { onConflict: onConflictColumn || userIdColumn });
            if (error) {
              console.error(`Error saving ${supabaseTableName} to Supabase:`, error);
              toast.error(`Failed to save ${supabaseTableName} preference.`);
            } else {
              // toast.success(`${supabaseTableName} saved to your account!`); // Removed for cleaner logs
            }
          } else {
            // For non-singleton (lists), this generic `setData` will not handle individual item mutations.
            // It's expected that the specific hook will manage individual item mutations
            // and then call `fetchData` to re-sync the state.
            // If `setData` is called with a full list, it will attempt to replace all.
            // This is a simplification for the generic hook.
            // For lists, it's better to use specific mutation functions (add, delete, update)
            // in the consuming hook, and then call `fetchData` to refresh.
            // We'll add a warning here.
            console.warn(`usePersistentData: Direct 'setData' for non-singleton tables (${supabaseTableName}) is not recommended for individual item mutations. Use specific mutation functions and then call 'fetchData' to re-sync.`);
          }
        } else if (!loading) {
          localStorage.setItem(localStorageKey, JSON.stringify(finalValue));
          // toast.success(`${localStorageKey} saved locally!`); // Removed for cleaner logs
        }
      }, debounceDelay);

      return finalValue;
    });
  }, [isLoggedInMode, session, supabase, localStorageKey, supabaseTableName, transformToDb, onConflictColumn, userIdColumn, debounceDelay, loading, isSingleton]);

  return { data, loading, isLoggedInMode, setData, fetchData };
}