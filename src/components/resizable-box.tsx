"use client";

import React from 'react';
import { ResizableBox as ReactResizableBox, ResizableBoxProps } from 'react-resizable';
import { cn } from '@/lib/utils';

// Extend ResizableBoxProps to allow for custom className and ensure children is defined
type CustomResizableBoxProps = ResizableBoxProps & {
  className?: string;
  children: React.ReactNode;
};

export const ResizableBox = ({ children, className, ...props }: CustomResizableBoxProps) => {
  return (
    <ReactResizableBox
      className={cn("relative", className)} // Add relative positioning for handles
      {...props}
    >
      {children}
    </ReactResizableBox>
  );
};

ResizableBox.displayName = "ResizableBox";