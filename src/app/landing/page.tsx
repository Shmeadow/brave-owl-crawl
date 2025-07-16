"use client"; // This is a client component

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, easeOut } from 'framer-motion';
import { LayoutGrid, Timer, MessageSquare, Crown } from 'lucide-react'; // Import icons for compact features

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
  };

  const featureIconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } },
  };

  const compactFeatures = [
    { icon: LayoutGrid, title: "Personalized Dashboard" },
    { icon: Timer, title: "Focus Timer" },
    { icon: MessageSquare, title: "Collaborative Rooms" },
    { icon: Crown, title: "Premium Features" },
  ];

  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" // Changed justify-start to justify-center
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

      {/* Hero Section Content */}
      <div className={cn(
        "relative z-10 flex flex-col items-center justify-center h-full px-4 py-16 text-white w-full max-w-5xl mx-auto" // Removed min-h-screen, added max-w-5xl
      )}>
        <motion.h1
          className="text-5xl md:text-7xl font-extrabold mb-4 text-center drop-shadow-lg text-white leading-tight"
          variants={itemVariants}
        >
          Your Ultimate <span className="text-primary-foreground">Productivity Sanctuary</span>
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl mb-8 max-w-3xl text-center drop-shadow-md text-white/90"
          variants={itemVariants}
        >
          CozyHub is your all-in-one workspace designed to boost focus, track goals, and foster collaboration.
          Transform your digital environment into a haven of productivity.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12" // Added mb-12 for spacing
          variants={itemVariants}
        >
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/login">Get Started Today</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/20">
            <Link href="/dashboard">Explore as Guest</Link>
          </Button>
        </motion.div>

        {/* Compact Feature Highlights */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl px-4 py-6 bg-black/30 backdrop-blur-md rounded-lg border border-white/20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {compactFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center text-white/90"
              variants={featureIconVariants}
              custom={index} // Pass index as custom prop for staggered animation
            >
              <feature.icon className="h-8 w-8 text-primary-foreground mb-2" />
              <p className="text-sm font-semibold">{feature.title}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}