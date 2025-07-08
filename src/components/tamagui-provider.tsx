"use client";

import { TamaguiProvider as TamaguiProviderOG } from 'tamagui'
import { useTheme } from 'next-themes'
import config from '../../tamagui.config'
import { useEffect, useState } from 'react';

export function TamaguiProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState('system');

  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  return (
    <TamaguiProviderOG
      config={config}
      defaultTheme={currentTheme as any}
    >
      {children}
    </TamaguiProviderOG>
  )
}