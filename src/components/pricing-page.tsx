"use client";

import React, { useState } from 'react';
import { PlanCard } from './plan-card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from './ui/button';

const plans = [
  {
    name: 'Free',
    tagline: 'For casual users & basic needs.',
    price: { monthly: 0, annually: 0, weekly: 0 },
    features: [
      { text: 'Limited Todos', included: true },
      { text: 'Limited Track Sessions', included: true },
      { text: '45 Mins/day Live Background', included: true },
      { text: 'No Advanced Analytics', included: false },
      { text: 'No Cloud Sync', included: false },
    ],
    buttonVariant: 'outline' as const,
  },
  {
    name: 'Unlimited',
    tagline: 'Best value for power users.',
    price: { monthly: 7.99, annually: 59.88, weekly: 2.99 },
    originalPrice: { monthly: 7.99 },
    discount: { annually: '38% Off', weekly: '25% Off' },
    features: [
      { text: 'Unlimited Todos', included: true },
      { text: 'Unlimited Track Sessions', included: true },
      { text: 'Unlimited Live Backgrounds', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'Cloud Sync', included: true },
      { text: 'Priority Support', included: true },
    ],
    isMostPopular: true,
    buttonVariant: 'default' as const,
  },
  {
    name: 'Pro',
    tagline: 'For professionals & teams.',
    price: { monthly: 14.99, annually: 119.88, weekly: 4.99 },
    originalPrice: { monthly: 14.99 },
    discount: { annually: '33% Off', weekly: '28% Off' },
    features: [
      { text: 'All Unlimited Features', included: true },
      { text: 'Team Collaboration', included: true },
      { text: 'Advanced Security & SSO', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'API Access', included: true },
    ],
    buttonVariant: 'default' as const,
  },
];

export function PricingPage({ onUpgrade }: { onUpgrade: () => void }) {
  const [billingCycle, setBillingCycle] = useState<'annually' | 'monthly' | 'weekly'>('annually');

  return (
    <div className="w-full py-12 px-4 bg-muted/50 dark:bg-background/80 rounded-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing Plans</h2>
        <p className="mt-2 text-lg text-muted-foreground">Choose the plan that's right for you.</p>
      </div>

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
      
      <div className="mt-12 text-center bg-primary/5 border border-primary/20 p-6 rounded-lg max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-foreground">Explore the whole premium feature suite</h3>
        <Button onClick={onUpgrade} size="lg" className="mt-4">Get Unlimited</Button>
      </div>
    </div>
  );
}