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
        "relative flex flex-col text-center p-3 sm:p-4 transition-shadow duration-300 shadow-md hover:shadow-xl bg-card", // Reduced padding
        plan.isMostPopular && "border-primary ring-2 ring-primary shadow-primary/20"
      )}>
        {plan.isMostPopular && (
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-semibold rounded-full"> {/* Reduced padding */}
            Most Popular
          </div>
        )}
        <CardHeader className="pb-1 sm:pb-2"> {/* Reduced padding-bottom */}
          <CardTitle className="text-base sm:text-lg font-bold">{plan.name}</CardTitle> {/* Reduced font size */}
          <p className="text-xs text-muted-foreground">{plan.tagline}</p>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
          <div className="mb-2 sm:mb-3 min-h-[60px] sm:min-h-[70px]"> {/* Reduced margin-bottom and min-height */}
            {hasDiscount && (
              <div className="mb-0.5"> {/* Reduced margin-bottom */}
                <span className="text-sm line-through text-muted-foreground">${originalPrice.toFixed(2)}</span>
                <span className="ml-0.5 bg-destructive text-destructive-foreground text-xs font-bold px-1 py-0.5 rounded-full"> {/* Reduced margin-left and padding */}
                  {discountInfo.percent}% OFF
                </span>
              </div>
            )}
            <p className="text-2xl sm:text-3xl font-extrabold">${discountedPrice.toFixed(2)}</p> {/* Reduced font size */}
            <p className="text-xs text-muted-foreground">{getBillingText()}</p>
            {hasDiscount && <p className="text-xs text-primary mt-0.5">First time purchase only</p>} {/* Reduced margin-top */}
          </div>
          <Button
            onClick={onUpgrade}
            variant={plan.buttonVariant}
            className="w-full font-bold text-sm py-2 sm:py-3 mb-3 sm:mb-4 transition-transform hover:scale-105" // Reduced font size and padding
            disabled={plan.name === 'Free'}
          >
            {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
          </Button>
          <ul className="space-y-1 text-left flex-grow text-xs sm:text-sm"> {/* Reduced space-y and font size */}
            {plan.features.map((feature, index) => (
              <li key={index} className={cn("flex items-center gap-1", !feature.included && "text-muted-foreground")}> {/* Reduced gap */}
                {feature.included ? <Check className="h-3 w-3 text-green-500 flex-shrink-0" /> : <Minus className="h-3 w-3 text-muted-foreground flex-shrink-0" />} {/* Reduced icon size */}
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}