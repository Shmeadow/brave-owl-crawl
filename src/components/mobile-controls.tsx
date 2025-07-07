"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MobileControlsProps {
  children: React.ReactNode;
}

export function MobileControls({ children }: MobileControlsProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[900] flex flex-col gap-2 md:hidden">
      {children}
    </div>
  );
}