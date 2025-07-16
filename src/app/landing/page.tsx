"use client"; // This is a client component

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoginFeatureSection } from '@/components/login-feature-section';
import { cn } from '@/lib/utils';
import { motion, easeOut } from 'framer-motion'; // Import motion and easeOut

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

  return (
    <motion.div
      className="relative h-screen flex flex-col items-center justify-start overflow-hidden" // Changed min-h-screen to h-screen
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
        "relative z-10 flex flex-col items-center justify-center h-[70vh] px-4 py-8 text-white w-full", // Adjusted height and padding
        "bg-transparent"
      )}>
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold mb-3 text-center drop-shadow-lg text-white leading-tight" // Reduced font size and margin
          variants={itemVariants}
        >
          Your Ultimate <span className="text-primary-foreground">Productivity Sanctuary</span>
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl mb-6 max-w-2xl text-center drop-shadow-md text-white/90" // Reduced font size and margin
          variants={itemVariants}
        >
          CozyHub is your all-in-one workspace designed to boost focus, track goals, and foster collaboration.
          Transform your digital environment into a haven of productivity.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center" // Reduced gap
          variants={itemVariants}
        >
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/login">Get Started Today</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/20">
            <Link href="/dashboard">Explore as Guest</Link>
          </Button>
        </motion.div>
      </div>

      {/* Login Feature Section */}
      <div className="relative z-10 w-full bg-background/50 backdrop-blur-xl py-8 px-4 border-t border-border h-[30vh] flex items-center justify-center"> {/* Adjusted height and padding */}
        <motion.div
          className="w-full max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: easeOut }}
        >
          <h2 className="text-2xl font-extrabold text-foreground mb-4 leading-tight"> {/* Reduced font size and margin */}
            Discover What You Can Achieve
          </h2>
          <LoginFeatureSection className="w-full" />
        </motion.div>
      </div>
    </motion.div>
  );
}