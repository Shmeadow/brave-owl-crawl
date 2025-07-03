"use client";

import React, { useEffect, useRef } from 'react';
import styles from './starfield.module.css';

export function StarfieldEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numStars = 100;
    const stars: HTMLDivElement[] = [];

    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div');
      star.className = styles.star;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 10}s`;
      star.style.animationDuration = `${2 + Math.random() * 8}s`;
      star.style.width = `${0.5 + Math.random() * 1.5}px`;
      star.style.height = star.style.width;
      star.style.opacity = `${0.5 + Math.random() * 0.5}`;
      container.appendChild(star);
      stars.push(star);
    }

    return () => {
      stars.forEach(star => star.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.starfieldContainer}></div>
  );
}