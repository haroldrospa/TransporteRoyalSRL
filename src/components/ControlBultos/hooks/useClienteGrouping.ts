
import { useMemo } from 'react';
import { Conduce } from '@/types/conduces';

export interface ClienteGroup {
  cliente: string;
  razonSocial?: string;
  ciudad?: string;
  ruta?: string;
  encomendado?: string;
  totalConduces: number;
  totalBultos: number;
  conduces: Conduce[];
}

interface GroupedConduces {
  cliente: string;
  razonSocial?: string;
  ciudad?: string;
  conduces: Conduce[];
}

export const useClienteGrouping = (conduces: Conduce[]) => {
  const groupedConduces = useMemo(() => {
    // Create a map to group by client number.
    // Conduces without a client (unassigned) must NOT be grouped together —
    // each one becomes its own row keyed by conduce id/number.
    const groupedMap = conduces.reduce((acc, conduce) => {
      const hasCliente = conduce.numeroCliente && String(conduce.numeroCliente).trim() !== '';
      const key = hasCliente
        ? String(conduce.numeroCliente)
        : `__sin_asignar__:${conduce.id ?? conduce.numeroConduce}`;

      if (!acc[key]) {
        acc[key] = {
          cliente: hasCliente ? String(conduce.numeroCliente) : '',
          razonSocial: conduce.razonSocial,
          ciudad: conduce.ciudad,
          conduces: []
        };
      }
      acc[key].conduces.push(conduce);
      return acc;
    }, {} as Record<string, GroupedConduces>);

    // Convert to array and add aggregated data
    return Object.values(groupedMap).map(group => ({
      ...group,
      ruta: group.conduces[0]?.ruta,
      encomendado: group.conduces[0]?.encomendado,
      totalConduces: group.conduces.length,
      totalBultos: group.conduces.reduce((sum, conduce) => sum + conduce.cantidadBultos, 0)
    })).sort((a, b) =>
      (a.cliente || a.razonSocial || '').localeCompare(b.cliente || b.razonSocial || '')
    ) as ClienteGroup[];
  }, [conduces]);

  return { groupedConduces };
};
