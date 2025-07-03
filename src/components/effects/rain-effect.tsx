"use client";

import React, { useEffect, useRef } from 'react';
import styles from './rain.module.css';

export function RainEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numDrops = 300; // Increased number of drops for denser rain
    const drops: HTMLDivElement[] = [];

    for (let i = 0; i < numDrops; i++) {
      const drop = document.createElement('div');
      drop.className = styles.drop;
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDelay = `${Math.random() * 3}s`; // Slightly longer delay range for more natural start
      drop.style.animationDuration = `${0.8 + Math.random() * 1.2}s`; // Varied fall speed
      drop.style.width = `${1 + Math.random() * 1.5}px`; // Slightly wider drops
      drop.style.height = `${25 + Math.random() * 25}px`; // Longer drops
      drop.style.opacity = `${0.4 + Math.random() * 0.4}`; // More opaque, less transparent
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