"use client";

import React, { useEffect, useRef } from 'react';
import styles from './snow.module.css';

export function SnowEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numSnowflakes = 300;
    const snowflakes: HTMLDivElement[] = [];

    for (let i = 0; i < numSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = styles.snowflake;

      // Random initial horizontal position for the start of the fall (in pixels)
      const initialX = Math.random() * window.innerWidth;
      snowflake.style.setProperty('--initial-x-px', `${initialX}px`);

      // Random overall horizontal drift amount (in pixels, relative to initialX)
      const driftAmount = (Math.random() - 0.5) * 400; // e.g., -200px to +200px
      snowflake.style.setProperty('--drift-x-px', `${driftAmount}px`);

      // Random sway amount (side-to-side oscillation in pixels)
      const swayAmount = Math.random() * 30 + 10; // 10px to 40px
      snowflake.style.setProperty('--sway-amount-px', `${swayAmount}px`);

      // Random animation durations for fall and sway
      const fallDuration = 10 + Math.random() * 15; // 10s to 25s
      const swayDuration = 5 + Math.random() * 10; // 5s to 15s

      snowflake.style.setProperty('--fall-duration', `${fallDuration}s`);
      snowflake.style.setProperty('--sway-duration', `${swayDuration}s`);

      // Random animation delay
      snowflake.style.animationDelay = `${Math.random() * 10}s`;

      // Random size
      const size = `${1.5 + Math.random() * 3.5}px`;
      snowflake.style.width = size;
      snowflake.style.height = size;

      // Random opacity
      snowflake.style.opacity = `${0.5 + Math.random() * 0.5}`;

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