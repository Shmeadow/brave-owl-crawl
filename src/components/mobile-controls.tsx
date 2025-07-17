"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { MOBILE_CONTROLS_BOTTOM_OFFSET, MOBILE_CONTROLS_HORIZONTAL_PADDING, MOBILE_CONTROLS_GAP_VERTICAL } from '@/lib/constants';

interface MobileControlsProps {
  children: React.ReactNode;
}

export function MobileControls({ children }: MobileControlsProps) {
  return (
    <div className={cn(
      "fixed z-[900] flex flex-col",
      `bottom-[${MOBILE_CONTROLS_BOTTOM_OFFSET}px]`,
      `left-[${MOBILE_CONTROLS_HORIZONTAL_PADDING}px]`,
      `right-[${MOBILE_CONTROLS_HORIZONTAL_PADDING}px]`,
      `gap-[${MOBILE_CONTROLS_GAP_VERTICAL}px]`
    )}>
      {children}
    </div>
  );
}