export const colors = {
  brand: '#6B2C1F',
  brandLight: '#8B3A2A',
  canvas: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F9FAFB',
  border: '#E5E7EB',
  text: '#101828',
  textMuted: '#6A7282',
  success: '#009966',
  warning: '#BB4D00',
  danger: '#EF4444',
  info: '#155DFC',
} as const;

export const radius = { small: 4, medium: 8, large: 14, panel: 16, pill: 999 } as const;
export const space = { xxs: 4, xs: 6, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
export const shadow = {
  shadowColor: '#101828',
  shadowOpacity: 0.1,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
} as const;
