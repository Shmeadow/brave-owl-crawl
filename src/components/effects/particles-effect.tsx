"use client";

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import styles from './particles.module.css';

export function ParticlesEffect() {
  return (
    <div className={styles.particlesContainer}>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className={styles.particle}></div>
      ))}
    </div>
  );
}