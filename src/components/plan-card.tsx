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
        "relative flex flex-col text-center p-4 transition-shadow duration-300 shadow-md hover:shadow-xl bg-card", // Reduced p-6 to p-4
        plan.isMostPopular && "border-primary ring-2 ring-primary shadow-primary/20"
      )}>
        {plan.isMostPopular && (
          <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-0.5 text-xs font-semibold rounded-full"> {/* Reduced padding and font size */}
            Most Popular
          </div>
        )}
        <CardHeader className="pb-3"> {/* Reduced pb-4 to pb-3 */}
          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle> {/* Reduced text-2xl to text-xl */}
          <p className="text-sm text-muted-foreground">{plan.tagline}</p> {/* Reduced font size */}
        </CardHeader>
        <CardContent className="flex flex-col flex-grow">
          <div className="mb-4 min-h-[80px]"> {/* Reduced mb-6 to mb-4, min-h from 100px to 80px */}
            {hasDiscount && (
              <div className="mb-1"> {/* Reduced mb-2 to mb-1 */}
                <span className="text-base line-through text-muted-foreground">${originalPrice.toFixed(2)}</span> {/* Reduced text-lg to text-base */}
                <span className="ml-1 bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full"> {/* Reduced padding */}
                  {discountInfo.percent}% OFF
                </span>
              </div>
            )}
            <p className="text-4xl font-extrabold">${discountedPrice.toFixed(2)}</p> {/* Reduced text-5xl to text-4xl */}
            <p className="text-xs text-muted-foreground">{getBillingText()}</p> {/* Reduced font size */}
            {hasDiscount && <p className="text-xs text-primary mt-1">First time purchase only</p>}
          </div>
          <Button
            onClick={onUpgrade}
            variant={plan.buttonVariant}
            className="w-full font-bold text-base py-4 mb-6 transition-transform hover:scale-105" // Reduced text-lg to text-base, py-6 to py-4, mb-8 to mb-6
            disabled={plan.name === 'Free'}
          >
            {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
          </Button>
          <ul className="space-y-2 text-left flex-grow text-sm"> {/* Reduced space-y-3 to space-y-2, added text-sm */}
            {plan.features.map((feature, index) => (
              <li key={index} className={cn("flex items-center gap-2", !feature.included && "text-muted-foreground")}> {/* Reduced gap-3 to gap-2 */}
                {feature.included ? <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> : <Minus className="h-4 w-4 text-muted-foreground flex-shrink-0" />} {/* Reduced icon size */}
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}