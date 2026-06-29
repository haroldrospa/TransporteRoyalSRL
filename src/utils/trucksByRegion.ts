import { Region } from '@/types/conduces';

export const getTrucksByRegion = (region: Region): string[] => {
  if (region === 'Sur') {
    return ['R-01', 'R-02', 'Almacen'];
  } else {
    return ['R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'C-01', 'Almacen'];
  }
};

export const getAllValidTrucks = (): string[] => {
  return ['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'C-01', 'Almacen'];
};

export const getCamionesStatsByRegion = (region: Region) => {
  if (region === 'Sur') {
    return {
      'R-01': { clientCount: 0, bultos: 0 },
      'R-02': { clientCount: 0, bultos: 0 }
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