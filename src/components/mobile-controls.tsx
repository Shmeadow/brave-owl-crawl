"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MobileControlsProps {
  children: React.ReactNode;
}

export function MobileControls({ children }: MobileControlsProps) {
  return (
    <div className="fixed bottom-2 left-2 right-2 z-[900] flex flex-col gap-1 md:hidden">
      {children}
    </div>
  );
}