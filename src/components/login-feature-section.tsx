"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Timer, ListTodo, Goal, NotebookPen, BookOpen, Volume2, Image, MessageSquare, Crown } from 'lucide-react';
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
    { icon: Goal, title: "Goal Tracking", description: "Set and achieve your long-term aspirations.", delay: 0.5 },
    { icon: NotebookPen, title: "Notes & Journaling", description: "Capture ideas and reflect on your progress.", delay: 0.6 },
    { icon: BookOpen, title: "Flashcards", description: "Master new concepts with spaced repetition.", delay: 0.7 },
    { icon: Volume2, title: "Ambient Sounds", description: "Immerse yourself with calming background audio.", delay: 0.8 },
    { icon: Image, title: "Custom Backgrounds", description: "Personalize your visual environment.", delay: 0.9 },
    { icon: MessageSquare, title: "Collaborative Rooms", description: "Study or work with friends in shared spaces.", delay: 1.0 },
    { icon: Crown, title: "Premium Features", description: "Unlock advanced analytics, custom themes, and more.", delay: 1.1 },
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
      <div className="text-center mb-6">
        <h2 className="text-4xl font-extrabold text-foreground mb-2 leading-tight">
          Features of <span className="text-primary">CozyHub</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover what makes CozyHub your ultimate productivity companion.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
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