"use client";

import React, { useEffect, useRef } from 'react';
import styles from './rain.module.css';

export function RainEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numDrops = 80;
    const drops: HTMLDivElement[] = [];

    for (let i = 0; i < numDrops; i++) {
      const drop = document.createElement('div');
      drop.className = styles.drop;
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDelay = `${Math.random() * 5}s`;
      drop.style.animationDuration = `${0.8 + Math.random() * 1.2}s`;
      drop.style.width = `${1 + Math.random() * 1}px`;
      drop.style.height = `${15 + Math.random() * 15}px`;
      drop.style.opacity = `${0.3 + Math.random() * 0.5}`;
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