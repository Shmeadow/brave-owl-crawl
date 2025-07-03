"use client";

import React, { useEffect, useRef } from 'react';
import styles from './snow.module.css';

export function SnowEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numSnowflakes = 600; // Increased number of drops for denser rain
    const snowflakes: HTMLDivElement[] = [];

    for (let i = 0; i < numSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = styles.snowflake;

      // Random initial horizontal position
      snowflake.style.left = `${Math.random() * 100}%`;

      // Random sway amount (side-to-side oscillation in pixels)
      const swayAmount = Math.random() * 40 + 20; // 20px to 60px
      snowflake.style.setProperty('--sway-amount-px', `${swayAmount}px`);

      // Random animation durations for fall and sway
      const fallDuration = 20 + Math.random() * 20; // 20s to 40s
      const swayDuration = 10 + Math.random() * 10; // 10s to 20s

      snowflake.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
      snowflake.style.animationDelay = `${Math.random() * 20}s, ${Math.random() * 20}s`; // Longer delays

      // Random size
      const size = `${1.5 + Math.random() * 2.5}px`; // Slightly smaller max size for density
      snowflake.style.width = size;
      snowflake.style.height = size;

      // Random opacity
      snowflake.style.opacity = `${0.6 + Math.random() * 0.4}`; // More opaque
      
      container.appendChild(snowflake);
      snowflakes.push(snowflake);
    }

    return () => {
      snowflakes.forEach(snowflake => snowflake.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.snowContainer}></div>
  );
}