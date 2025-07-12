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

      const swayAmount = Math.random() * 30 + 10;
      snowflake.style.setProperty('--tw-sway-amount-px', `${swayAmount}px`); // Use Tailwind's custom property syntax

      const fallDuration = 20 + Math.random() * 20;
      const swayDuration = 10 + Math.random() * 10;

      snowflake.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
      snowflake.style.animationDelay = `${Math.random() * 20}s, ${Math.random() * 20}s`;

      const size = `${1.5 + Math.random() * 2.5}px`;
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