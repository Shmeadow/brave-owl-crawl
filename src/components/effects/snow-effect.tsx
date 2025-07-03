"use client";

import React, { useEffect, useRef } from 'react';
import styles from './snow.module.css';

export function SnowEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numSnowflakes = 300; // Increased number for more density
    const snowflakes: HTMLDivElement[] = [];

    for (let i = 0; i < numSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = styles.snowflake;

      // Random initial horizontal position
      snowflake.style.left = `${Math.random() * 100}%`;

      // Random animation delay
      snowflake.style.animationDelay = `${Math.random() * 10}s`;
      // Random animation duration (faster fall)
      snowflake.style.animationDuration = `${6 + Math.random() * 10}s`; // Faster, wider range

      // Random size
      const size = `${1.5 + Math.random() * 3.5}px`; // Smaller min, larger max
      snowflake.style.width = size;
      snowflake.style.height = size;

      // Random opacity
      snowflake.style.opacity = `${0.5 + Math.random() * 0.5}`; // Slightly more opaque overall

      // Custom properties for wind and sway
      const startXOffset = (Math.random() - 0.5) * 200; // Initial horizontal spread
      const endXOffset = startXOffset + (Math.random() - 0.5) * 300; // Overall horizontal drift
      const swayAmount = Math.random() * 60 + 10; // How much it sways (min 10px, max 70px)

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