import { createRoku } from './roku';
import { createSamsung } from './samsung';
import { createLG } from './lg';

export const BRANDS = ['Roku', 'Samsung', 'LG'];

export function createDriver(brand, ip, saved, onToken) {
  if (brand === 'Roku') return createRoku(ip);
  if (brand === 'Samsung') return createSamsung(ip, saved, onToken);
  if (brand === 'LG') return createLG(ip, saved, onToken);
  throw new Error('Marca no soportada');
}
