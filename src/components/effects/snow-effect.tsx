"use client";

import React, { useEffect, useRef } from 'react';

export function SnowEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numSnowflakes = 600;
    const snowflakes: HTMLDivElement[] = [];

    for (let i = 0; i < numSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'absolute rounded-full shadow-snowflake-glow animate-fall animate-sway bg-snowflake-white';

      snowflake.style.left = `${Math.random() * 100}%`;

      const swayAmount = Math.random() * 40 + 10; // Wider sway
      snowflake.style.setProperty('--tw-sway-amount-px', `${swayAmount}px`);

      const fallDuration = 25 + Math.random() * 20; // Slower fall
      const swayDuration = 15 + Math.random() * 10; // Slower sway

      snowflake.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
      snowflake.style.animationDelay = `${Math.random() * 20}s, ${Math.random() * 20}s`;

      const size = `${1 + Math.random() * 4}px`; // Wider size range
      snowflake.style.width = size;
      snowflake.style.height = size;

      snowflake.style.opacity = `${0.6 + Math.random() * 0.4}`;
      
      container.appendChild(snowflake);
      snowflakes.push(snowflake);
    }

    return () => {
      snowflakes.forEach((drop: HTMLDivElement) => drop.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[899] overflow-hidden bg-transparent"></div>
  );
}