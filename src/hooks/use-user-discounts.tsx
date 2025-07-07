"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { usePersistentData } from './use-persistent-data'; // Import the new hook

export type BillingCycle = 'weekly' | 'monthly' | 'annually';

interface DbUsedDiscount {
  id: string;
  user_id: string;
  billing_cycle: BillingCycle;
  used_at: string;
}

const LOCAL_STORAGE_KEY = 'guest_used_discounts';
const SUPABASE_TABLE_NAME = 'used_discounts';

export function useUserDiscounts() {
  const { supabase, session } = useSupabase();

  const {
    data: usedDiscounts,
    loading,
    isLoggedInMode,
    setData: setUsedDiscounts,
    fetchData,
  } = usePersistentData<BillingCycle[], DbUsedDiscount>({ // T_APP_DATA is BillingCycle[], T_DB_DATA_ITEM is DbUsedDiscount
    localStorageKey: LOCAL_STORAGE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: [],
    selectQuery: 'billing_cycle',
    transformFromDb: (dbDiscounts: DbUsedDiscount[]) => dbDiscounts.map(d => d.billing_cycle),
    transformToDb: (appData: BillingCycle, userId: string) => ({ // appItem is BillingCycle, returns DbUsedDiscount
      user_id: userId,
      billing_cycle: appData,
      id: crypto.randomUUID(), // Placeholder for ID, will be ignored on insert/upsert if DB generates it
      used_at: new Date().toISOString(), // Placeholder
    }),
    userIdColumn: 'user_id',
    onConflictColumn: 'id', // Assuming 'id' is the primary key for upsert during migration
    debounceDelay: 0,
  });

  const recordDiscountUsage = async (cycle: BillingCycle) => {
    if (!session || !supabase || usedDiscounts.includes(cycle)) {
      return;
    }
    if (isLoggedInMode) {
      const { error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .insert({ user_id: session.user.id, billing_cycle: cycle });

      if (error) {
        toast.error('There was an issue applying your discount.');
        console.error('Error recording discount usage:', error);
      } else {
        toast.success(`Your one-time ${cycle} discount has been applied!`);
        fetchData(); // Re-fetch to update state
      }
    } else {
      // For guests, just update local state
      setUsedDiscounts(prev => [...prev, cycle]);
      toast.success(`Your one-time ${cycle} discount has been applied (locally)!`);
    }
  };

  return { usedDiscounts, loading, recordDiscountUsage };
}