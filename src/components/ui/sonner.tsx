'use client';

import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme as 'light' | 'dark'}
      richColors
      position="bottom-right"
      toastOptions={{
        duration: 3000,
      }}
    />
  );
}
