"use client";

import React, { useEffect, useRef } from 'react';
import styles from './looking-through-plants.module.css';

// Assume these image paths exist in your public/plants folder
const plantImages = [
  "/plants/plant1.png",
  "/plants/plant2.png",
  "/plants/plant3.png",
  // Add more plant image paths here if you have them
];

export function LookingThroughPlantsEffect() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const numShapes = 8; // Number of plant shapes
    const shapes: HTMLImageElement[] = []; // Changed to HTMLImageElement

    for (let i = 0; i < numShapes; i++) {
      const shape = document.createElement('img'); // Changed to img element
      shape.className = styles.plantShape;
      shape.src = plantImages[Math.floor(Math.random() * plantImages.length)]; // Randomly select a plant image
      shape.alt = "Plant overlay"; // Add alt text for accessibility

      // Random size for the shapes
      const size = `${150 + Math.random() * 250}px`; // 150px to 400px
      shape.style.width = size;
      shape.style.height = size;

      // Random position near the edges
      const edgeOffset = 50; // Max offset from edge in pixels
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x, y;
      const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

      switch (edge) {
        case 0: // Top edge
          x = Math.random() * viewportWidth;
          y = -Math.random() * edgeOffset;
          break;
        case 1: // Right edge
          x = viewportWidth - (Math.random() * edgeOffset);
          y = Math.random() * viewportHeight;
          break;
        case 2: // Bottom edge
          x = Math.random() * viewportWidth;
          y = viewportHeight - (Math.random() * edgeOffset);
          break;
        case 3: // Left edge
          x = -Math.random() * edgeOffset;
          y = Math.random() * viewportHeight;
          break;
        default:
          x = Math.random() * viewportWidth;
          y = Math.random() * viewportHeight;
      }

      shape.style.left = `${x}px`;
      shape.style.top = `${y}px`;

      // Random rotation for variety
      shape.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      container.appendChild(shape);
      shapes.push(shape);
    }

    return () => {
      shapes.forEach(s => s.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.plantsContainer}></div>
  );
}