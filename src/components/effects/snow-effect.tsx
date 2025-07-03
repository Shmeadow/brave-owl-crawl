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

      // Random initial horizontal position
      snowflake.style.left = `${Math.random() * 100}%`;

      // Random sway amount (side-to-side oscillation in pixels)
      const swayAmount = Math.random() * 30 + 10; // 10px to 40px
      snowflake.style.setProperty('--sway-amount-px', `${swayAmount}px`);

      // Random animation durations for fall and sway
      const fallDuration = 10 + Math.random() * 15; // 10s to 25s
      const swayDuration = 5 + Math.random() * 10; // 5s to 15s

      snowflake.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
      snowflake.style.animationDelay = `${Math.random() * 10}s, ${Math.random() * 10}s`;

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