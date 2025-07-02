"use client";

import React from 'react';
import { ResizableBox as ReactResizableBox, ResizableBoxProps } from 'react-resizable';
import { cn } from '@/lib/utils';

// Extend ResizableBoxProps to allow for custom className
type CustomResizableBoxProps = ResizableBoxProps & {
  className?: string;
};

export const ResizableBox = React.forwardRef<HTMLDivElement, CustomResizableBoxProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <ReactResizableBox
        ref={ref} // Forward the ref to the underlying ReactResizableBox
        className={cn("relative", className)} // Add relative positioning for handles
        {...props}
      >
        {children}
      </ReactResizableBox>
    );
  }
);

ResizableBox.displayName = "ResizableBox"; // Add display name for better debugging