"use client";

import React, { useState } from 'react';
import { PlanCard } from './plan-card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FeatureComparisonGrid } from './feature-comparison-grid';

const plans = [
  {
    name: 'Free',
    tagline: 'For casual users & basic needs.',
    price: { monthly: 0, annually: 0, weekly: 0 },
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
    price: { monthly: 4.99, annually: 9.99, weekly: 0.99 },
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
    price: { monthly: 9.99, annually: 14.99, weekly: 2.99 },
    isMostPopular: true,
    buttonVariant: 'default' as const,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited Focus Sessions', included: true },
      { text: 'Custom Backgrounds & Journal', included: true },
      { text: 'Premium Analytics', included: true },
      { text: 'Seamless Device Sync', included: true },
    ],
  },
];

export function PricingContent({ onUpgrade }: { onUpgrade: () => void }) {
  const [billingCycle, setBillingCycle] = useState<'annually' | 'monthly' | 'weekly'>('annually');

  return (
    <div className="w-full">
      <div className="flex justify-center mb-10">
        <ToggleGroup
          type="single"
          value={billingCycle}
          onValueChange={(value) => {
            if (value) setBillingCycle(value as any);
          }}
          className="bg-background p-1 rounded-full border"
        >
          <ToggleGroupItem value="annually" aria-label="Pay Annually" className="rounded-full px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Pay Annually
          </ToggleGroupItem>
          <ToggleGroupItem value="monthly" aria-label="Pay Monthly" className="rounded-full px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Pay Monthly
          </ToggleGroupItem>
          <ToggleGroupItem value="weekly" aria-label="Pay Weekly" className="rounded-full px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            Pay Weekly
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} billingCycle={billingCycle} onUpgrade={onUpgrade} />
        ))}
      </div>

      <FeatureComparisonGrid onChoosePlan={onUpgrade} />
    </div>
  );
}