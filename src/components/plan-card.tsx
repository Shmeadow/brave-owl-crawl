"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PlanCardProps {
  plan: {
    name: string;
    tagline: string;
    price: {
      monthly: number;
      annually: number;
      weekly: number;
    };
    features: { text: string; included: boolean }[];
    isMostPopular?: boolean;
    buttonVariant: 'outline' | 'default';
  };
  billingCycle: 'monthly' | 'annually' | 'weekly';
  onUpgrade: () => void;
}

export function PlanCard({ plan, billingCycle, onUpgrade }: PlanCardProps) {
  const getPriceText = () => {
    switch (billingCycle) {
      case 'annually':
        return plan.price.annually.toFixed(2);
      case 'weekly':
        return plan.price.weekly.toFixed(2);
      case 'monthly':
      default:
        return plan.price.monthly.toFixed(2);
    }
  };

  const getBillingText = () => {
    switch (billingCycle) {
      case 'annually':
        return '/yr';
      case 'weekly':
        return '/wk';
      case 'monthly':
      default:
        return '/mth';
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
          <div className="mb-6">
            <p className="text-5xl font-extrabold">${getPriceText()}</p>
            <p className="text-sm text-muted-foreground">{getBillingText()}</p>
          </div>
          <Button
            onClick={onUpgrade}
            variant={plan.buttonVariant}
            className="w-full font-bold text-lg py-6 mb-8 transition-transform hover:scale-105"
          >
            UPGRADE
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