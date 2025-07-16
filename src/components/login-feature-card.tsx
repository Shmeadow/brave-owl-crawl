"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay: number;
  className?: string;
}

export function LoginFeatureCard({ icon: Icon, title, description, delay, className }: LoginFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      className={cn("h-full", className)}
    >
      <Card className="h-full bg-card/70 backdrop-blur-xl flex flex-col items-center text-center p-2"> {/* Reduced padding */}
        <Icon className="h-6 w-6 text-primary mb-1" /> {/* Reduced icon size and margin */}
        <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3> {/* Reduced font size and margin */}
        <p className="text-xs text-muted-foreground">{description}</p>
      </Card>
    </motion.div>
  );
}