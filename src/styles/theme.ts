'use client';

import { createTheme, type MantineColorsTuple } from '@mantine/core';

const cyan: MantineColorsTuple = [
  '#E6FDFF',
  '#C6FBFF',
  '#9FF7FF',
  '#7DF9FF',
  '#4DE8F2',
  '#25CED9',
  '#14A8B2',
  '#0E8089',
  '#0A5D63',
  '#063D42',
];

export const theme = createTheme({
  primaryColor: 'cyan',
  primaryShade: { light: 6, dark: 3 },
  defaultRadius: 'md',
  fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
  headings: { fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' },
  colors: { cyan },
  other: {
    surface: 'rgba(255,255,255,0.03)',
    surfaceBorder: 'rgba(255,255,255,0.08)',
    glowCyan: 'rgba(125,249,255,0.18)',
  },
  components: {
    Paper: {
      defaultProps: { radius: 'md' },
    },
    Button: {
      defaultProps: { radius: 'md' },
    },
  },
});
