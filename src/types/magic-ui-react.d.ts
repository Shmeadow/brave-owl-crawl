declare module 'magic-ui-react' {
  import * as React from 'react';

  interface DockProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: 'horizontal' | 'vertical';
    children?: React.ReactNode;
  }

  interface DockIconProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }

  export const Dock: React.FC<DockProps>;
  export const DockIcon: React.FC<DockIconProps>;
}