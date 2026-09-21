export const Colors = {
  // Dark emerald green primary palette
  emerald: {
    900: '#0a1f17',
    850: '#0d2820',
    800: '#103025',
    700: '#1a4a38',
    600: '#236b50',
    500: '#2d8c6a',
    400: '#3da67f',
    300: '#5cc49b',
  },
  // Metallic gold accent palette
  gold: {
    700: '#8b6914',
    600: '#a67c1a',
    500: '#c9962e',
    400: '#d4af37',
    300: '#e0c050',
    200: '#ecd380',
    100: '#f5e6a8',
  },
  // Neutrals
  neutral: {
    950: '#050a08',
    900: '#0a1410',
    800: '#121f1a',
    700: '#1c2b25',
    600: '#2a3d35',
    500: '#3d5249',
    400: '#5c756a',
    300: '#7a9489',
    200: '#a8c0b5',
    100: '#d0e0d8',
  },
  // Semantic
  primary: '#d4af37',
  success: '#2d8c6a',
  warning: '#d4af37',
  error: '#c0392b',
  danger: '#e74c3c',
  // Backgrounds
  background: '#0a1410',
  surface: '#121f1a',
  surfaceElevated: '#1c2b25',
  border: '#1c2b25',
  // Text
  textPrimary: '#f5f5f0',
  textSecondary: '#a8c0b5',
  textMuted: '#5c756a',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  display: 48,
} as const;

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  gold: {
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
