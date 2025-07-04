"use client";

import React, { useEffect, useRef } from 'react';
import styles from './snow.module.css';

export function SnowEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numSnowflakes = 600;
    const snowflakes: HTMLDivElement[] = [];

    for (let i = 0; i < numSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = styles.snowflake;

      snowflake.style.left = `${Math.random() * 100}%`;

      // Adjusted sway amount for a more gentle feel (10px to 40px)
      const swayAmount = Math.random() * 30 + 10;
      snowflake.style.setProperty('--sway-amount-px', `${swayAmount}px`);

      const fallDuration = 20 + Math.random() * 20; // 20s to 40s
      const swayDuration = 10 + Math.random() * 10; // 10s to 20s

      snowflake.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
      snowflake.style.animationDelay = `${Math.random() * 20}s, ${Math.random() * 20}s`;

      const size = `${1.5 + Math.random() * 2.5}px`;
      snowflake.style.width = size;
      snowflake.style.height = size;

      snowflake.style.opacity = `${0.6 + Math.random() * 0.4}`;
      
      container.appendChild(snowflake);
      snowflakes.push(snowflake);
    }

    return () => {
      // Fixed: Changed 'drops' to 'snowflakes' and added type annotation for 'drop'
      snowflakes.forEach((drop: HTMLDivElement) => drop.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.snowContainer}></div>
  );
}