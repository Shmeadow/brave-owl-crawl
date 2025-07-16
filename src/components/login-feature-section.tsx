"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Timer, ListTodo, BookOpen } from 'lucide-react'; // Selected 4 icons
import { LoginFeatureCard } from './login-feature-card';
import { cn } from '@/lib/utils';

interface LoginFeatureSectionProps {
  className?: string; // Allow external classes
}

export function LoginFeatureSection({ className }: LoginFeatureSectionProps) { // Accept className
  const features = [
    { icon: LayoutGrid, title: "Personalized Dashboard", description: "Organize your workspace with draggable widgets.", delay: 0.2 },
    { icon: Timer, title: "Focus Timer", description: "Boost productivity with customizable Pomodoro sessions.", delay: 0.3 },
    { icon: ListTodo, title: "Task Management", description: "Keep track of your to-dos and stay organized.", delay: 0.4 },
    { icon: BookOpen, title: "Flashcards", description: "Master new concepts with spaced repetition.", delay: 0.5 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col items-center justify-center text-center", // Keep core layout
        className // Apply external classes
      )}
    >
      {/* Removed the h2 and p tags from here, as they are now in landing/page.tsx */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full"> {/* Adjusted grid and gap */}
        {features.map((feature, index) => (
          <LoginFeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={feature.delay}
          />
        ))}
      </div>
    </motion.div>
  );
}