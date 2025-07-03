"use client";

import React, { useEffect, useRef } from 'react';
import styles from './cosmic.module.css';

export function CosmicEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numStars = 200; // Increased stars for denser feel
    const stars: HTMLDivElement[] = [];

    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div');
      star.className = styles.star;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 20}s`; // Longer delays for more variation
      star.style.animationDuration = `${10 + Math.random() * 20}s`; // Longer durations
      star.style.width = `${0.5 + Math.random() * 3}px`; // Wider range of sizes
      star.style.height = star.style.width;
      star.style.opacity = `${0.2 + Math.random() * 0.8}`; // Varying opacity
      container.appendChild(star);
      stars.push(star);
    }

    return () => {
      stars.forEach(star => star.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.cosmicContainer}>
      {/* Nebula-like background elements */}
      <div className={styles.nebula1}></div>
      <div className={styles.nebula2}></div>
      <div className={styles.nebula3}></div>
    </div>
  );
}