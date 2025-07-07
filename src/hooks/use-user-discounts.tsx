"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/auth';
import { toast } from 'sonner';

export type BillingCycle = 'weekly' | 'monthly' | 'annually';

export function useUserDiscounts() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [usedDiscounts, setUsedDiscounts] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsedDiscounts = useCallback(async () => {
    if (!session || !supabase) {
      setUsedDiscounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('used_discounts')
      .select('billing_cycle')
      .eq('user_id', session.user.id);

    if (error) {
      toast.error('Failed to load your discount information.');
      console.error('Error fetching used discounts:', error);
      setUsedDiscounts([]);
    } else {
      setUsedDiscounts(data.map(d => d.billing_cycle as BillingCycle));
    }
    setLoading(false);
  }, [session, supabase]);

  useEffect(() => {
    if (!authLoading) {
      fetchUsedDiscounts();
    }
  }, [authLoading, fetchUsedDiscounts]);

  const recordDiscountUsage = async (cycle: BillingCycle) => {
    if (!session || !supabase || usedDiscounts.includes(cycle)) {
      return;
    }
    const { error } = await supabase
      .from('used_discounts')
      .insert({ user_id: session.user.id, billing_cycle: cycle });

    if (error) {
      toast.error('There was an issue applying your discount.');
      console.error('Error recording discount usage:', error);
    } else {
      toast.success(`Your one-time ${cycle} discount has been applied!`);
      fetchUsedDiscounts(); // Re-fetch to update state
    }
  };

  return { usedDiscounts, loading, recordDiscountUsage };
}