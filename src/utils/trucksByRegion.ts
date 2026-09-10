import { Region } from '@/types/conduces';

export const getRegionByTruck = (truck?: string | null): Region | null => {
  if (!truck) return null;
  const clean = truck.trim().toUpperCase();
  if (clean === 'R-01' || clean === 'R-02' || clean === 'R-1' || clean === 'R-2') {
    return 'Sur';
  }
  if (clean === 'R-08' || clean === 'R-09' || clean === 'R-8' || clean === 'R-9') {
    return 'Este';
  }
  if (['R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'C-01', 'R-3', 'R-4', 'R-5', 'R-6', 'R-7'].includes(clean)) {
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