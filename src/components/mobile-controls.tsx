"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MobileControlsProps {
  children: React.ReactNode;
}

export function MobileControls({ children }: MobileControlsProps) {
  return (
    <div className="fixed bottom-1 left-1 right-1 z-[900] flex flex-col gap-0.5 md:hidden"> {/* Reduced bottom, left, right, and gap */}
      {children}
    </div>
  );
}