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
      <Card className="h-full backdrop-blur-xl flex flex-col items-center text-center p-3"> {/* Reduced p-4 to p-3 */}
        <Icon className="h-7 w-7 text-primary mb-2" /> {/* Reduced h-8 w-8 to h-7 w-7, mb-3 to mb-2 */}
        <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3> {/* Reduced text-lg to text-base */}
        <p className="text-xs text-muted-foreground">{description}</p> {/* Reduced text-sm to text-xs */}
      </Card>
    </motion.div>
  );
}