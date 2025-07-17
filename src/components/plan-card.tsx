"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BillingCycle } from '@/hooks/use-user-discounts';

interface Plan {
  name: string;
  tagline: string;
  price: { [key in BillingCycle]: number };
  discounts: { [key in BillingCycle]?: { percent: number } };
  features: { text: string; included: boolean }[];
  isMostPopular?: boolean;
  buttonVariant: 'outline' | 'default';
}

interface PlanCardProps {
  plan: Plan;
  billingCycle: BillingCycle;
  onUpgrade: () => void;
  isDiscountAvailable: boolean;
}

export function PlanCard({ plan, billingCycle, onUpgrade, isDiscountAvailable }: PlanCardProps) {
  const originalPrice = plan.price[billingCycle];
  const discountInfo = plan.discounts[billingCycle];
  const hasDiscount = isDiscountAvailable && discountInfo && plan.name !== 'Free';
  const discountedPrice = hasDiscount ? originalPrice * (1 - discountInfo.percent / 100) : originalPrice;

  const getBillingText = () => {
    switch (billingCycle) {
      case 'annually': return '/yr';
      case 'weekly': return '/wk';
      case 'monthly': default: return '/mo';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="" // Removed h-full
    >
      <Card className={cn(
        "relative flex flex-col text-center p-3 transition-shadow duration-300 shadow-md hover:shadow-xl bg-card",
        plan.isMostPopular && "border-primary ring-2 ring-primary shadow-primary/20"
      )}>
        {plan.isMostPopular && (
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-0.5 text-xs font-semibold rounded-full">
            Most Popular
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg font-bold">{plan.name}</CardTitle>
          <p className="text-xs text-muted-foreground">{plan.tagline}</p>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
          <div className="mb-3 min-h-[70px]">
            {hasDiscount && (
              <div className="mb-1">
                <span className="text-sm line-through text-muted-foreground">${originalPrice.toFixed(2)}</span>
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {discountInfo.percent}% OFF
                </span>
              </div>
            )}
            <p className="text-2xl sm:text-3xl font-extrabold">${discountedPrice.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{getBillingText()}</p>
            {hasDiscount && <p className="text-xs text-primary mt-1">First time purchase only</p>}
          </div>
          <Button
            onClick={onUpgrade}
            variant={plan.buttonVariant}
            className="w-full font-bold text-base py-3 mb-4 transition-transform hover:scale-105"
            disabled={plan.name === 'Free'}
          >
            {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
          </Button>
          <ul className="space-y-1.5 text-left flex-grow text-sm">
            {plan.features.map((feature, index) => (
              <li key={index} className={cn("flex items-center gap-1.5", !feature.included && "text-muted-foreground")}>
                {feature.included ? <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}