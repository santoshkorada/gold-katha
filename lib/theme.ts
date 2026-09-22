export const Colors = {
  // Primary Fintech Navy
  emerald: {
    // Keeping 'emerald' name to avoid breaking existing code, but changing values to deep navy/slate
    900: '#020617', // slate-950
    850: '#0F172A', // slate-900 (primary deep blue)
    800: '#1E293B', // slate-800
    700: '#334155', // slate-700
    600: '#475569', // slate-600
    500: '#64748B', // slate-500
    400: '#94A3B8', // slate-400
    300: '#CBD5E1', // slate-300
  },
  // Amber / Gold accents
  gold: {
    700: '#92400e', // amber-800
    600: '#b45309', // amber-700
    500: '#d97706', // amber-600
    400: '#f59e0b', // amber-500
    300: '#fbbf24', // amber-400
    200: '#fcd34d', // amber-300
    100: '#fde68a', // amber-200
  },
  // Light Neutrals for background and cards
  neutral: {
    950: '#F8FAFC', // slate-50 (App background)
    900: '#F1F5F9', // slate-100 (Secondary background)
    800: '#E2E8F0', // slate-200 (Borders)
    700: '#CBD5E1', // slate-300
    600: '#94A3B8', // slate-400
    500: '#64748B', // slate-500
    400: '#475569', // slate-600 (Muted text)
    300: '#334155', // slate-700
    200: '#1E293B', // slate-800 (Secondary text)
    100: '#0F172A', // slate-900 (Primary text)
  },
  // Semantic
  primary: '#0F172A',
  success: '#10B981', // emerald-500
  warning: '#f59e0b',
  error: '#EF4444', // red-500
  danger: '#DC2626', // red-600
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
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
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  gold: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;
