"use client";

import React, { useEffect, useRef } from 'react';
import styles from './cosmic.module.css';

export function CosmicEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numStars = 150; // More stars for a denser feel
    const stars: HTMLDivElement[] = [];

    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div');
      star.className = styles.star;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 15}s`; // Longer delays for more variation
      star.style.animationDuration = `${5 + Math.random() * 15}s`; // Longer durations
      star.style.width = `${0.5 + Math.random() * 2.5}px`; // Wider range of sizes
      star.style.height = star.style.width;
      star.style.opacity = `${0.3 + Math.random() * 0.7}`; // Varying opacity
      container.appendChild(star);
      stars.push(star);
    }

    return () => {
      stars.forEach(star => star.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.cosmicContainer}></div>
  );
}