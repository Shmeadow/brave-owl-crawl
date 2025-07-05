"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function WowButton() {
  const [showHoverBar, setShowHoverBar] = useState(false);

  const handleWowClick = () => {
    setShowHoverBar(true);
    // Hide the bar after 3 seconds
    setTimeout(() => {
      setShowHoverBar(false);
    }, 3000);
  };

  return (
    <div className="relative">
      <Button onClick={handleWowClick} size="lg">
        Wow
      </Button>

      <AnimatePresence>
        {showHoverBar && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 p-3 bg-primary text-primary-foreground rounded-lg shadow-lg whitespace-nowrap"
          >
            See?!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}