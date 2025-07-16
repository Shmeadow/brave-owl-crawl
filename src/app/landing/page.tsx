"use client"; // This is a client component

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, easeOut } from 'framer-motion';
import {
  LayoutGrid, Timer, MessageSquare, Crown, ListTodo, Goal, NotebookPen,
  BookOpen, Volume2, Image, Calendar, Palette, BarChart2, WandSparkles
} from 'lucide-react'; // Import all necessary icons

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Faster stagger for more elements
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
  };

  const featureIconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easeOut } }, // Faster animation
  };

  const allFeatures = [
    { icon: LayoutGrid, title: "Dashboards" },
    { icon: Timer, title: "Focus Timers" },
    { icon: ListTodo, title: "Task Lists" },
    { icon: Goal, title: "Goal Tracking" },
    { icon: NotebookPen, title: "Journaling" },
    { icon: BookOpen, title: "Flashcards" },
    { icon: Volume2, title: "Ambient Sounds" },
    { icon: Image, title: "Backgrounds" },
    { icon: MessageSquare, title: "Live Chat" },
    { icon: Calendar, title: "Calendar" },
    { icon: Palette, title: "Drawing Board" },
    { icon: BarChart2, title: "Analytics" },
    { icon: WandSparkles, title: "Visual Effects" },
    { icon: Crown, title: "Premium Access" },
  ];

  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-4" // Added p-4 for overall padding
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Background for Hero Section */}
      <div className="absolute inset-0 z-0">
        <video
          src="/animated/ani2.mp4"
          loop
          muted
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Stronger Gradient overlay for text readability and visual depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      </div>

      {/* Cute Funny Shapes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-24 h-24 bg-white/10 rounded-full animate-pulse-slow"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-primary/10 rounded-full animate-pulse-slow-reverse"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-20 h-20 bg-white/5 rounded-full animate-pulse-slow"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Hero Section Content */}
      <div className={cn(
        "relative z-10 flex flex-col items-center justify-center h-full text-white w-full max-w-5xl mx-auto"
      )}>
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold mb-3 text-center drop-shadow-lg text-white leading-tight" // Adjusted font size and margin
          variants={itemVariants}
        >
          Your Ultimate <span className="text-primary-foreground">Productivity Sanctuary</span>
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl mb-6 max-w-3xl text-center drop-shadow-md text-white/90" // Adjusted font size and margin
          variants={itemVariants}
        >
          CozyHub is your all-in-one workspace designed to boost focus, track goals, and foster collaboration.
          Transform your digital environment into a haven of productivity.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8" // Adjusted gap and margin
          variants={itemVariants}
        >
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/login">Get Started Today</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/20">
            <Link href="/dashboard">Explore as Guest</Link>
          </Button>
        </motion.div>

        {/* All Features Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 w-full max-w-4xl px-4 py-4 bg-black/30 backdrop-blur-md rounded-lg border border-white/20" // Adjusted grid, padding
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {allFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center text-white/90"
              variants={featureIconVariants}
              custom={index}
            >
              <feature.icon className="h-6 w-6 text-primary-foreground mb-1" /> {/* Adjusted icon size */}
              <p className="text-xs font-semibold">{feature.title}</p> {/* Adjusted font size */}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}