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
      className="h-full"
    >
      <Card className={cn(
        "relative flex flex-col h-full text-center p-6 transition-shadow duration-300 shadow-md hover:shadow-xl bg-card",
        plan.isMostPopular && "border-primary ring-2 ring-primary shadow-primary/20"
      )}>
        {plan.isMostPopular && (
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full">
            Most Popular
          </div>
        )}
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
          <p className="text-muted-foreground">{plan.tagline}</p>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
          <div className="mb-6 min-h-[100px]">
            {hasDiscount && (
              <div className="mb-2">
                <span className="text-lg line-through text-muted-foreground">${originalPrice.toFixed(2)}</span>
                <span className="ml-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {discountInfo.percent}% OFF
                </span>
              </div>
            )}
            <p className="text-5xl font-extrabold">${discountedPrice.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">{getBillingText()}</p>
            {hasDiscount && <p className="text-xs text-primary mt-1">First time purchase only</p>}
          </div>
          <Button
            onClick={onUpgrade}
            variant={plan.buttonVariant}
            className="w-full font-bold text-lg py-6 mb-8 transition-transform hover:scale-105"
            disabled={plan.name === 'Free'}
          >
            {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
          </Button>
          <ul className="space-y-3 text-left flex-grow">
            {plan.features.map((feature, index) => (
              <li key={index} className={cn("flex items-center gap-3", !feature.included && "text-muted-foreground")}>
                {feature.included ? <Check className="h-5 w-5 text-green-500 flex-shrink-0" /> : <Minus className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}