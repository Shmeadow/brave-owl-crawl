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
    { icon: LayoutGrid, title: "Dashboards", color: "text-blue-400", description: "Organize your workspace with widgets." },
    { icon: Timer, title: "Focus Timers", color: "text-green-400", description: "Boost productivity with Pomodoro sessions." },
    { icon: ListTodo, title: "Task Lists", color: "text-purple-400", description: "Keep track of your daily to-dos." },
    { icon: Goal, title: "Goal Tracking", color: "text-yellow-400", description: "Set and achieve your long-term aspirations." },
    { icon: NotebookPen, title: "Journaling", color: "text-pink-400", description: "Capture ideas and reflect on your progress." },
    { icon: BookOpen, title: "Flashcards", color: "text-orange-400", description: "Master new concepts with spaced repetition." },
    { icon: Volume2, title: "Ambient Sounds", color: "text-teal-400", description: "Immerse yourself with calming background audio." },
    { icon: Image, title: "Backgrounds", color: "text-indigo-400", description: "Personalize your visual environment." },
    { icon: MessageSquare, title: "Live Chat", color: "text-red-400", description: "Collaborate with friends in shared spaces." },
    { icon: Calendar, title: "Calendar", color: "text-cyan-400", description: "Manage events and stay organized." },
    { icon: Palette, title: "Drawing Board", color: "text-lime-400", description: "Sketch ideas and brainstorm visually." },
    { icon: BarChart2, title: "Analytics", color: "text-fuchsia-400", description: "Track your productivity and progress." },
    { icon: WandSparkles, title: "Visual Effects", color: "text-emerald-400", description: "Add dynamic visual effects to your space." },
    { icon: Crown, title: "Premium Access", color: "text-gold", description: "Unlock advanced features and customization." },
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

      {/* Illustrative Shapes (Canva-inspired) */}
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
      {/* Additional shapes for more illustrative feel */}
      <motion.div
        className="absolute top-1/10 right-1/10 w-16 h-16 bg-blue-400/10 rounded-full animate-pulse-slow-reverse"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: -270 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-1/5 left-1/5 w-28 h-28 bg-green-400/10 rounded-full animate-pulse-slow"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 180 }}
        transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
      />
      {/* New "Scribble" Shapes */}
      <motion.div
        className="absolute top-[5%] left-[50%] w-12 h-12 bg-yellow-300/15 rounded-full animate-pulse-fast"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 180 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[10%] w-16 h-16 bg-purple-300/15 rounded-full animate-pulse-slow"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: -90 }}
        transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-[30%] right-[5%] w-10 h-10 bg-red-300/15 rounded-full animate-pulse-fast-reverse"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 270 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[40%] w-14 h-14 bg-cyan-300/15 rounded-full animate-pulse-slow-reverse"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: -180 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
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
              <feature.icon className={cn("h-6 w-6 mb-1", feature.color)} /> {/* Adjusted icon size and added color */}
              <p className="text-xs font-semibold">{feature.title}</p> {/* Adjusted font size */}
              <p className="text-[0.65rem] text-white/70 mt-0.5 leading-tight">{feature.description}</p> {/* Tiny description */}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}