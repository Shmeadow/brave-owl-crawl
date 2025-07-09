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
      <Card className="h-full bg-card/50 backdrop-blur-xl border-white/20 flex flex-col items-center text-center p-4">
        <Icon className="h-8 w-8 text-primary mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Card>
    </motion.div>
  );
}