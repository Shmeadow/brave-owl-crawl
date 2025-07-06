"use client";

import React, { useState } from 'react';
import { PlanCard } from './plan-card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FeatureComparisonGrid } from './feature-comparison-grid';
import { useUserDiscounts, BillingCycle } from '@/hooks/use-user-discounts';
import { useSupabase } from '@/integrations/supabase/auth';
import { Loader2 } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    tagline: 'For casual users & basic needs.',
    price: { weekly: 0, monthly: 0, annually: 0 },
    discounts: {},
    features: [
      { text: 'Basic To-Dos', included: true },
      { text: 'Up to 5 Focus Sessions', included: true },
      { text: '45 Mins/day Live Backgrounds', included: true },
      { text: 'No Advanced Analytics', included: false },
      { text: 'No Cloud Sync', included: false },
    ],
    buttonVariant: 'outline' as const,
  },
  {
    name: 'Pro',
    tagline: 'For dedicated individuals.',
    price: { weekly: 1.99, monthly: 7.99, annually: 79.99 },
    discounts: {
      weekly: { percent: 40 },
      monthly: { percent: 25 },
      annually: { percent: 10 },
    },
    features: [
      { text: 'Unlimited Tasks', included: true },
      { text: '10 Focus Sessions', included: true },
      { text: 'Unlimited Live Backgrounds', included: true },
      { text: 'Ambient Sound Packs', included: true },
      { text: 'Theme Preferences', included: true },
    ],
    buttonVariant: 'default' as const,
  },
  {
    name: 'Unlimited',
    tagline: 'Best value for power users.',
    price: { weekly: 3.99, monthly: 12.99, annually: 129.99 },
    discounts: {
      weekly: { percent: 50 },
      monthly: { percent: 35 },
      annually: { percent: 20 },
    },
    isMostPopular: true,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited Focus Sessions', included: true },
      { text: 'Custom Backgrounds & Journal', included: true },
      { text: 'Premium Analytics', included: true },
      { text: 'Seamless Device Sync', included: true },
    ],
    buttonVariant: 'default' as const,
  },
];

export function PricingContent({ onUpgrade }: { onUpgrade: () => void }) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('weekly');
  const { session } = useSupabase();
  const { usedDiscounts, loading: discountsLoading, recordDiscountUsage } = useUserDiscounts();

  const handleUpgradeClick = (cycle: BillingCycle) => {
    if (session) {
      recordDiscountUsage(cycle);
    }
    onUpgrade();
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-10">
        <ToggleGroup
          type="single"
          value={billingCycle}
          onValueChange={(value) => {
            if (value) setBillingCycle(value as BillingCycle);
          }}
          className="bg-background p-1 rounded-full border"
        >
          <ToggleGroupItem value="weekly" aria-label="Pay Weekly" className="rounded-full px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Weekly
          </ToggleGroupItem>
          <ToggleGroupItem value="monthly" aria-label="Pay Monthly" className="rounded-full px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem value="annually" aria-label="Pay Annually" className="rounded-full px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Annually
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {discountsLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              billingCycle={billingCycle}
              onUpgrade={() => handleUpgradeClick(billingCycle)}
              isDiscountAvailable={session ? !usedDiscounts.includes(billingCycle) : true}
            />
          ))}
        </div>
      )}

      <FeatureComparisonGrid onChoosePlan={onUpgrade} />
    </div>
  );
}