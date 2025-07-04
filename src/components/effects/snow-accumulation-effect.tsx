"use client";

import React, { useEffect, useRef } from 'react';
import styles from './snow-accumulation.module.css';

export function SnowAccumulationEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numPatches = 50; // Number of snow patches
    const patches: HTMLDivElement[] = [];

    for (let i = 0; i < numPatches; i++) {
      const patch = document.createElement('div');
      patch.className = styles.snowPatch;
      
      // Random position within the container
      patch.style.left = `${Math.random() * 100}%`;
      patch.style.top = `${Math.random() * 100}%`;
      
      // Random size and shape
      const size = `${20 + Math.random() * 80}px`; // 20px to 100px
      const aspectRatio = 0.5 + Math.random(); // Make it slightly oval
      patch.style.width = size;
      patch.style.height = `${parseFloat(size) * aspectRatio}px`;
      patch.style.borderRadius = `${50 + Math.random() * 50}% ${50 + Math.random() * 50}% ${50 + Math.random() * 50}% ${50 + Math.random() * 50}% / ${50 + Math.random() * 50}% ${50 + Math.random() * 50}% ${50 + Math.random() * 50}% ${50 + Math.random() * 50}%`;

      // Random opacity and blur
      patch.style.opacity = `${0.2 + Math.random() * 0.4}`; // More subtle
      patch.style.filter = `blur(${1 + Math.random() * 3}px)`; // Subtle blur

      // Random animation delay for staggered appearance
      patch.style.animationDelay = `${Math.random() * 5}s`;
      
      container.appendChild(patch);
      patches.push(patch);
    }

    return () => {
      patches.forEach(patch => patch.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.snowAccumulationContainer}></div>
  );
}