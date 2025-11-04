// Exportar componentes de logos
export { Imagotipo } from './components/Imagotipo';
export { ImagotipoImage } from './components/ImagotipoImage';
export { Isotipo } from './components/Isotipo';
export { Logo } from './components/Logo';

// Exportar rutas de imágenes para uso directo
export const ASSET_PATHS = {
  logo: {
    imagotipo: '/assets/images/logo/Imagotipo.webp',
  }
} as const;

// Type helper para las rutas de assets
export type AssetPath = typeof ASSET_PATHS;

// Constantes de colores de marca
export const BRAND_COLORS = {
  primary: '#800039',
  primaryLight: '#a50049',
  primaryDark: '#5a0028',
  background: {
    light: '#f7f7f7',
    dark: '#4a4a4a',
  },
  lines: '#7a7a7a',
} as const;

