"use client";

import React, { useEffect, useRef } from 'react';

export function RainEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numDrops = 300;
    const drops: HTMLDivElement[] = [];

    for (let i = 0; i < numDrops; i++) {
      const drop = document.createElement('div');
      drop.className = 'absolute rounded-full animate-fall bg-rain-blue';
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDelay = `${Math.random() * 3}s`;
      drop.style.animationDuration = `${0.6 + Math.random() * 1.0}s`; // Slightly faster
      drop.style.width = `${0.5 + Math.random() * 1.0}px`; // Thinner
      drop.style.height = `${30 + Math.random() * 30}px`; // Longer
      drop.style.opacity = `${0.2 + Math.random() * 0.4}`; // Less opaque
      container.appendChild(drop);
      drops.push(drop);
    }

    return () => {
      drops.forEach(drop => drop.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[899] overflow-hidden bg-transparent"></div>
  );
}