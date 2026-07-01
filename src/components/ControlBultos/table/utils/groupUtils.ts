
import { Conduce } from '@/types/conduces';
import { Cliente } from '@/types/cliente';
import { calculateTransitTime } from '@/utils/time/transitTime';

export interface ClienteGroup {
  numeroCliente: string;
  allNumeroClientes: string[];
  rnc?: string;
  razonSocial: string;
  ciudad: string;
  totalConduces: number;
  totalBultos: number;
  conduces: Conduce[];
  ruta?: string;
  laboratorio: string;
  encomendadoPredeterminado?: string;
}

export const groupConducesByClient = (
  conduces: Conduce[], 
  clientesRncMap?: Map<string, string>,
  clienteGrupoMap?: Map<string, string>,
  clienteEncomendadoMap?: Map<string, string>
): ClienteGroup[] => {
  return conduces.reduce((groups: ClienteGroup[], conduce) => {
    const hasCliente = conduce.numeroCliente && String(conduce.numeroCliente).trim() !== '';

    // Conduces without an assigned client must NOT be grouped together —
    // each one becomes its own row keyed by the conduce id/number.
    if (!hasCliente) {
      const uniqueKey = `__sin_asignar__:${conduce.id ?? conduce.numeroConduce}`;
      groups.push({
        numeroCliente: uniqueKey,
        allNumeroClientes: [],
        rnc: '',
        razonSocial: conduce.razonSocial || '',
        ciudad: conduce.ciudad || '',
        totalConduces: 1,
        totalBultos: conduce.cantidadBultos,
        conduces: [conduce],
        ruta: conduce.ruta,
        laboratorio: conduce.laboratorio,
        encomendadoPredeterminado: ''
      });
      return groups;
    }

    // Determine group key: use grupo_cliente if available, otherwise use numeroCliente
    const grupoId = clienteGrupoMap?.get(conduce.numeroCliente);

    const existingGroup = groups.find(g =>
      grupoId
        ? g.allNumeroClientes.some(nc => clienteGrupoMap?.get(nc) === grupoId)
        : g.numeroCliente === conduce.numeroCliente
    );

    if (existingGroup) {
      existingGroup.conduces.push(conduce);
      existingGroup.totalConduces += 1;
      existingGroup.totalBultos += conduce.cantidadBultos;
      if (!existingGroup.allNumeroClientes.includes(conduce.numeroCliente)) {
        existingGroup.allNumeroClientes.push(conduce.numeroCliente);
      }
      // Append lab info if different
      if (conduce.laboratorio && !existingGroup.laboratorio.includes(conduce.laboratorio)) {
        existingGroup.laboratorio += `, ${conduce.laboratorio}`;
      }
    } else {
      groups.push({
        numeroCliente: conduce.numeroCliente,
        allNumeroClientes: [conduce.numeroCliente],
        rnc: clientesRncMap?.get(conduce.numeroCliente) || '',
        razonSocial: conduce.razonSocial || '',
        ciudad: conduce.ciudad || '',
        totalConduces: 1,
        totalBultos: conduce.cantidadBultos,
        conduces: [conduce],
        ruta: conduce.ruta,
        laboratorio: conduce.laboratorio,
        encomendadoPredeterminado: clienteEncomendadoMap?.get(conduce.numeroCliente) || ''
      });
    }

    return groups;
  }, []).sort((a, b) => {
    const getWorstTransitTime = (group: ClienteGroup) => {
      return group.conduces.reduce((worst, conduce) => {
        const transitTime = calculateTransitTime(conduce.fechaEntrega, conduce.numeroCliente);
        return transitTime.totalHours > worst ? transitTime.totalHours : worst;
      }, 0);
    };
    
    return getWorstTransitTime(b) - getWorstTransitTime(a);
  });
};
export const getRowColorClass = (conduce: Conduce) => {
  const transitInfo = calculateTransitTime(conduce.fechaEntrega, conduce.numeroCliente);
  
  if (transitInfo.status === 'expired') {
    return 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500';
  } else if (transitInfo.status === 'warning') {
    return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500';
  }
  return 'hover:bg-gray-50';
};

export const getGroupRowColorClass = (group: ClienteGroup) => {
  // Find the worst transit status in the group
  const worstStatus = group.conduces.reduce((worst, conduce) => {
    const transitInfo = calculateTransitTime(conduce.fechaEntrega, conduce.numeroCliente);
    if (transitInfo.status === 'expired') return 'expired';
    if (worst !== 'expired' && transitInfo.status === 'warning') return 'warning';
    return worst;
  }, 'normal' as 'normal' | 'warning' | 'expired');

  if (worstStatus === 'expired') {
    return 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500';
  } else if (worstStatus === 'warning') {
    return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500';
  }
  return 'bg-gray-50 hover:bg-gray-100';
};
