"use client";

import React, { useEffect, useRef } from 'react';

export function RaindropsEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numDrops = 150;
    const drops: HTMLDivElement[] = [];

    for (let i = 0; i < numDrops; i++) {
      const drop = document.createElement('div');
      drop.className = 'absolute rounded-full shadow-raindrop-inset blur-[0.5px] animate-raindrop-cycle bg-raindrop-blue';
      
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.top = `${Math.random() * 100}%`;
      
      const size = `${5 + Math.random() * 15}px`;
      drop.style.width = size;
      drop.style.height = size;

      const cycleDuration = 5 + Math.random() * 5;
      drop.style.setProperty('--cycle-duration', `${cycleDuration}s`);

      drop.style.animationDelay = `${Math.random() * cycleDuration}s`;
      
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