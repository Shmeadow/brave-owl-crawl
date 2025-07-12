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
      drop.style.animationDuration = `${0.8 + Math.random() * 1.2}s`;
      drop.style.width = `${1 + Math.random() * 1.5}px`;
      drop.style.height = `${25 + Math.random() * 25}px`;
      drop.style.opacity = `${0.4 + Math.random() * 0.4}`;
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