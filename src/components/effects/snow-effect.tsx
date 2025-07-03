"use client";

import React, { useEffect, useRef } from 'react';
import styles from './snow.module.css';

export function SnowEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numSnowflakes = 200; // Increased number of snowflakes
    const snowflakes: HTMLDivElement[] = [];

    for (let i = 0; i < numSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = styles.snowflake;
      snowflake.style.left = `${Math.random() * 100}%`;
      snowflake.style.animationDelay = `${Math.random() * 8}s`; // Slightly shorter delay range
      snowflake.style.animationDuration = `${8 + Math.random() * 8}s`; // Faster fall
      snowflake.style.width = `${2 + Math.random() * 4}px`; // Larger snowflakes
      snowflake.style.height = snowflake.style.width;
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