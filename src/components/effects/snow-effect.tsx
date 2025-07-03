"use client";

import React, { useEffect, useRef } from 'react';
import styles from './snow.module.css';

export function SnowEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numSnowflakes = 250; // Increased number for more density
    const snowflakes: HTMLDivElement[] = [];

    for (let i = 0; i < numSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = styles.snowflake;

      // Random initial horizontal position
      snowflake.style.left = `${Math.random() * 100}%`;

      // Random animation delay
      snowflake.style.animationDelay = `${Math.random() * 10}s`;
      // Random animation duration (faster fall)
      snowflake.style.animationDuration = `${8 + Math.random() * 8}s`;

      // Random size
      const size = `${2 + Math.random() * 4}px`;
      snowflake.style.width = size;
      snowflake.style.height = size;

      // Random opacity
      snowflake.style.opacity = `${0.6 + Math.random() * 0.4}`;

      // Custom properties for wind and sway
      const startXOffset = (Math.random() - 0.5) * 200; // Initial horizontal spread
      const endXOffset = startXOffset + (Math.random() - 0.5) * 300; // Overall horizontal drift
      const swayAmount = Math.random() * 50 + 20; // How much it sways (min 20px, max 70px)

      snowflake.style.setProperty('--start-x-offset', `${startXOffset}px`);
      snowflake.style.setProperty('--end-x-offset', `${endXOffset}px`);
      snowflake.style.setProperty('--sway-amount', `${swayAmount}px`);

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