export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0056CC',

  // Secondary colors
  secondary: '#F44336',
  secondaryDark: '#D32F2F',

  // Background colors
  background: '#f5f5f5',
  surface: '#fff',
  black: '#000',

  // Text colors
  textPrimary: '#000',
  textSecondary: '#666',
  textLight: '#fff',

  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',

  // Border colors
  border: '#ddd',
  borderError: '#ff3b30',

  // Overlay colors
  overlay: 'rgba(0,0,0,0.6)',

  // Stream background colors
  streamBackground: '#222',
  streamBackgroundSecondary: '#444',
} as const;

export type Colors = typeof colors;
