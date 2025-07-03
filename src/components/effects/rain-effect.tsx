"use client";

import React, { useEffect, useRef } from 'react';
import styles from './rain.module.css';

export function RainEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numDrops = 200; // Increased number of drops
    const drops: HTMLDivElement[] = [];

    for (let i = 0; i < numDrops; i++) {
      const drop = document.createElement('div');
      drop.className = styles.drop;
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDelay = `${Math.random() * 2}s`; // Shorter delay range for more constant rain
      drop.style.animationDuration = `${0.5 + Math.random() * 0.7}s`; // Faster fall
      drop.style.width = `${1 + Math.random() * 1.5}px`; // Slightly wider drops
      drop.style.height = `${25 + Math.random() * 25}px`; // Longer drops
      drop.style.opacity = `${0.3 + Math.random() * 0.5}`; // More opaque
      container.appendChild(drop);
      drops.push(drop);
    }

    return () => {
      drops.forEach(drop => drop.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.rainContainer}></div>
  );
}