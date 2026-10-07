import { Region } from '@/types/conduces';

// Normalize a truck code to standard format (e.g. 'R03' -> 'R-03')
export const normalizeTruckCode = (truck?: string | null): string => {
  if (!truck || typeof truck !== 'string') return '';
  const clean = truck.trim().toUpperCase().replace(/[-_ ]?ALMAC[EÉ]N$/i, '');
  const rMatch = clean.match(/^R-?0?(\d+)$/);
  if (rMatch) {
    const num = parseInt(rMatch[1], 10);
    return `R-${num < 10 ? '0' + num : num}`;
  }
  const cMatch = clean.match(/^C-?0?(\d+)$/);
  if (cMatch) {
    const num = parseInt(cMatch[1], 10);
    return `C-${num < 10 ? '0' + num : num}`;
  }
  return clean;
};

// Returns standard warehouse name for a truck (e.g. 'R-03' -> 'R03-Almacen')
export const getTruckWarehouse = (truck: string): string => {
  const norm = normalizeTruckCode(truck);
  const code = norm.replace('-', '');
  return `${code}-Almacen`;
};

// Check if an encomendado string is a truck warehouse
export const isTruckWarehouse = (encomendado?: string | null): boolean => {
  if (!encomendado) return false;
  return /[-_ ]?ALMAC[EÉ]N$/i.test(encomendado.trim()) && encomendado.trim().toLowerCase() !== 'almacen';
};

// Returns the base truck for an encomendado or warehouse (e.g. 'R03-Almacen' -> 'R-03')
export const getBaseTruck = (encomendado?: string | null): string => {
  if (!encomendado) return '';
  return normalizeTruckCode(encomendado);
};

export const getRegionByTruck = (truck?: string | null): Region | null => {
  if (!truck) return null;
  const clean = truck.trim().toUpperCase();
  const base = normalizeTruckCode(clean);
  
  if (base === 'R-01' || base === 'R-02') {
    return 'Sur';
  }
  if (base === 'R-08' || base === 'R-09') {
    return 'Este';
  }
  if (['R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'C-01'].includes(base)) {
    return 'Norte';
  }
  return null;
};

export const getTrucksByRegion = (region: Region | string): string[] => {
  if (region === 'Sur') {
    return ['R-01', 'R-02', 'Almacen'];
  } else if (region === 'Este') {
    return ['R-08', 'R-09', 'Almacen'];
  } else if (region === 'Norte') {
    return ['R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'C-01', 'Almacen'];
  } else {
    return getAllValidTrucks();
  }
};

export const getAllValidTrucks = (): string[] => {
  return ['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'R-08', 'R-09', 'C-01', 'Almacen'];
};

export const getCamionesStatsByRegion = (region: Region) => {
  if (region === 'Sur') {
    return {
      'R-01': { clientCount: 0, bultos: 0 },
      'R-02': { clientCount: 0, bultos: 0 }
    };
  } else if (region === 'Este') {
    return {
      'R-08': { clientCount: 0, bultos: 0 },
      'R-09': { clientCount: 0, bultos: 0 }
    };
  } else {
    return {
      'R-03': { clientCount: 0, bultos: 0 },
      'R-04': { clientCount: 0, bultos: 0 },
      'R-05': { clientCount: 0, bultos: 0 },
      'R-06': { clientCount: 0, bultos: 0 },
      'R-07': { clientCount: 0, bultos: 0 }
    };
  }
};