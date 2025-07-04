"use client";

import React, { useEffect, useRef } from 'react';
import styles from './raindrops.module.css';

export function RaindropsEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numDrops = 150; // Number of raindrops
    const drops: HTMLDivElement[] = [];

    for (let i = 0; i < numDrops; i++) {
      const drop = document.createElement('div');
      drop.className = styles.raindrop;
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.top = `${Math.random() * 100}%`;
      
      // Random size for drops
      const size = `${5 + Math.random() * 15}px`; // 5px to 20px
      drop.style.width = size;
      drop.style.height = size;

      // Random animation delay for staggered appearance
      drop.style.animationDelay = `${Math.random() * 5}s`; // Appear over 5 seconds
      
      container.appendChild(drop);
      drops.push(drop);
    }

    return () => {
      drops.forEach(drop => drop.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.raindropsContainer}></div>
  );
}