import React, { useMemo, useCallback } from 'react';
import { Cliente } from '@/types/cliente';
import { Conduce, Region, EstadoBulto } from '@/types/conduces';

export const useDataFilters = (conduces: Conduce[], clientes: Cliente[]) => {
  const clientesMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    for (const c of clientes) {
      if (c.numeroCliente) {
        map.set(String(c.numeroCliente).trim(), c);
      }
    }
    return map;
  }, [clientes]);

  const getClienteByNumero = useCallback((numeroCliente: string) => {
    if (!numeroCliente) return undefined;
    return clientesMap.get(String(numeroCliente).trim());
  }, [clientesMap]);

  const getConducesByEncomendado = (encomendado: string) => {
    return conduces.filter(c => c.encomendado === encomendado && c.estado === 'En tránsito');
  };

  const getConducesByEstado = (estado: EstadoBulto) => {
    return conduces.filter(c => c.estado === estado);
  };

  const getConducesByRegion = (region: Region) => {
    if (region === 'Todas') return conduces;
    return conduces.filter(c => c.region === region);
  };

  return {
    getClienteByNumero,
    getConducesByEncomendado,
    getConducesByEstado,
    getConducesByRegion
  };
};
