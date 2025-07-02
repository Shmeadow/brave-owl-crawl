"use client";

import React from 'react';
import { ResizableBox as ReactResizableBox, ResizableBoxProps } from 'react-resizable';
import { cn } from '@/lib/utils';

// Extend ResizableBoxProps to allow for custom className
type CustomResizableBoxProps = ResizableBoxProps & { // Changed from interface extends to type &
  className?: string;
};

export function ResizableBox({ children, className, ...props }: CustomResizableBoxProps) {
  return (
    <ReactResizableBox
      className={cn("relative", className)} // Add relative positioning for handles
      {...props}
    >
      {children}
    </ReactResizableBox>
  );
}