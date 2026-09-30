import { supabase } from '@/integrations/supabase/client';
import { getBaseTruck, getRegionByTruck, getTruckWarehouse } from '@/utils/trucksByRegion';
import { clearUltraCache } from './conduces/ultraFastFetchConduces';

export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 0; // 1 = Lunes, ..., 6 = Sábado, 0 = Domingo

export interface DiaConfig {
  numero: DiaSemana;
  nombre: string;
  nombreCorto: string;
}

export const DIAS_SEMANA: DiaConfig[] = [
  { numero: 1, nombre: 'Lunes', nombreCorto: 'Lun' },
  { numero: 2, nombre: 'Martes', nombreCorto: 'Mar' },
  { numero: 3, nombre: 'Miércoles', nombreCorto: 'Mié' },
  { numero: 4, nombre: 'Jueves', nombreCorto: 'Jue' },
  { numero: 5, nombre: 'Viernes', nombreCorto: 'Vie' },
  { numero: 6, nombre: 'Sábado', nombreCorto: 'Sáb' },
  { numero: 0, nombre: 'Domingo', nombreCorto: 'Dom' },
];

export interface ChoferCamionInfo {
  camion: string;
  chofer: string;
  region: string;
  rutasDisponibles: string[];
}

export const CAMIONES_DEFECTO: ChoferCamionInfo[] = [
  { camion: 'R-01', chofer: 'Candido Moreno', region: 'Sur', rutasDisponibles: ['0', '1', 'Todas', 'Descanso'] },
  { camion: 'R-02', chofer: 'Antony De los Santos', region: 'Sur', rutasDisponibles: ['0', '1', 'Todas', 'Descanso'] },
  { camion: 'R-03', chofer: 'Ricky Rodriguez', region: 'Norte', rutasDisponibles: ['1', '2', '0', 'Todas', 'Descanso'] },
  { camion: 'R-04', chofer: 'Wilmer', region: 'Norte', rutasDisponibles: ['1', '2', '0', 'Todas', 'Descanso'] },
  { camion: 'R-05', chofer: 'Arturo', region: 'Norte', rutasDisponibles: ['1', '2', '0', 'Todas', 'Descanso'] },
  { camion: 'R-06', chofer: 'Jonathan', region: 'Norte', rutasDisponibles: ['1', '2', '0', 'Todas', 'Descanso'] },
  { camion: 'R-07', chofer: 'Nuevo', region: 'Norte', rutasDisponibles: ['1', '2', '0', 'Todas', 'Descanso'] },
  { camion: 'R-08', chofer: 'Chofer R-08', region: 'Este', rutasDisponibles: ['1', '2', '0', 'Todas', 'Descanso'] },
  { camion: 'R-09', chofer: 'Chofer R-09', region: 'Este', rutasDisponibles: ['1', '2', '0', 'Todas', 'Descanso'] },
  { camion: 'C-01', chofer: 'Chofer C-01', region: 'Norte', rutasDisponibles: ['0', '1', 'Todas', 'Descanso'] },
];

// Structure: { [camion]: { [diaNumero]: '1' | '2' | 'Todas' | 'Descanso' } }
export type ProgramacionSemanal = Record<string, Record<number, string>>;

export const PROGRAMACION_PREDETERMINADA: ProgramacionSemanal = {
  'R-01': { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 0: 'Descanso' },
  'R-02': { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 0: 'Descanso' },
  'R-03': { 1: '1', 2: '2', 3: '1', 4: '2', 5: '1', 6: '2', 0: 'Descanso' },
  'R-04': { 1: '1', 2: '2', 3: '1', 4: '2', 5: '1', 6: '2', 0: 'Descanso' },
  'R-05': { 1: '1', 2: '2', 3: '1', 4: '2', 5: '1', 6: '2', 0: 'Descanso' },
  'R-06': { 1: '1', 2: '2', 3: '1', 4: '2', 5: '1', 6: '2', 0: 'Descanso' },
  'R-07': { 1: '1', 2: '2', 3: '1', 4: '2', 5: '1', 6: '2', 0: 'Descanso' },
  'R-08': { 1: '1', 2: '2', 3: '1', 4: '2', 5: '1', 6: '2', 0: 'Descanso' },
  'R-09': { 1: '1', 2: '2', 3: '1', 4: '2', 5: '1', 6: '2', 0: 'Descanso' },
  'C-01': { 1: '0', 2: '0', 3: '0', 4: '0', 5: '0', 6: '0', 0: 'Descanso' },
};

const SETTING_KEY = 'programacion_rutas_semanal';

export async function fetchProgramacionSemanal(): Promise<ProgramacionSemanal> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('id', SETTING_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return PROGRAMACION_PREDETERMINADA;
    }

    const parsed = JSON.parse(data.value);
    return { ...PROGRAMACION_PREDETERMINADA, ...parsed };
  } catch (err) {
    console.error('Error fetching weekly route schedule:', err);
    return PROGRAMACION_PREDETERMINADA;
  }
}

export async function saveProgramacionSemanal(programacion: ProgramacionSemanal): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        id: SETTING_KEY,
        value: JSON.stringify(programacion),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving weekly schedule:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving weekly schedule:', err);
    return false;
  }
}

export function getRutaProgramadaHoy(
  programacion: ProgramacionSemanal,
  camion: string,
  diaSemanaOverride?: number
): string {
  const baseTruck = getBaseTruck(camion);
  const dia = diaSemanaOverride !== undefined ? diaSemanaOverride : new Date().getDay();
  const scheduleForTruck = programacion[baseTruck] || PROGRAMACION_PREDETERMINADA[baseTruck];
  
  if (!scheduleForTruck) return 'Todas';
  return scheduleForTruck[dia] || 'Todas';
}

// Check if a conduce route matches the scheduled route for today
export function coincideRutaConProgramacion(
  rutaConduce: string | null | undefined,
  rutaProgramada: string
): boolean {
  if (!rutaProgramada || rutaProgramada === 'Todas') return true;
  if (rutaProgramada === 'Descanso') return false;
  
  const rutaNorm = (rutaConduce || '').trim().replace(/^ruta\s*/i, '');
  const progNorm = rutaProgramada.trim().replace(/^ruta\s*/i, '');

  // Sin ruta o '0' se considera Ruta 0 y se queda en el camión ("es lo mismo que ruta 0")
  if (!rutaNorm || rutaNorm === '0') return true;

  if (progNorm === '0') return !rutaNorm || rutaNorm === '0';
  return rutaNorm === progNorm;
}

export interface AsignacionDivisionResultado {
  success: boolean;
  total: number;
  enCamion: number;
  enAlmacen: number;
  sinAsignar: number;
  detalles: Array<{
    destino: string;
    esCamion: boolean;
    cantidad: number;
    camionBase: string;
  }>;
  mensaje: string;
}

/**
 * Asigna conduces a choferes / camiones dividiéndolos automáticamente:
 * - Los conduces que corresponden a la ruta de hoy (o sin ruta / Ruta 0) van al Camión.
 * - Los conduces que corresponden a otra ruta van automáticamente al Almacén del camión.
 * - Si encomendadoDestino es 'AUTO_CLIENTE', asigna a cada conduce el chofer predeterminado de su cliente.
 */
export async function asignarConducesConDivisionRuta(
  conduceIds: string[],
  encomendadoDestino: string,
  options?: {
    prioridad?: boolean;
    conduces?: any[];
    clientes?: any[];
    programacion?: ProgramacionSemanal;
  }
): Promise<AsignacionDivisionResultado> {
  if (!conduceIds || conduceIds.length === 0) {
    return {
      success: false,
      total: 0,
      enCamion: 0,
      enAlmacen: 0,
      sinAsignar: 0,
      detalles: [],
      mensaje: 'No hay conduces seleccionados para asignar.'
    };
  }

  try {
    const programacion = options?.programacion || await fetchProgramacionSemanal();
    let conducesList = options?.conduces || [];
    let clientesList = options?.clientes || [];

    // Si faltan conduces en la lista pasada, consultarlos de la base de datos
    const missingConduceIds = conduceIds.filter(id => !conducesList.some(c => c.id === id));
    if (missingConduceIds.length > 0) {
      const { data: fetchedConduces } = await supabase
        .from('conduces')
        .select('id, numero_conduce, numero_cliente, ciudad, encomendado')
        .in('id', missingConduceIds);
      
      if (fetchedConduces) {
        const mapped = fetchedConduces.map(c => ({
          id: c.id,
          numeroConduce: c.numero_conduce,
          numeroCliente: c.numero_cliente,
          ruta: '0',
          ciudad: c.ciudad,
          encomendado: c.encomendado
        }));
        conducesList = [...conducesList, ...mapped];
      }
    }

    // Mapa de clientes para búsqueda rápida
    const clientesMap = new Map<string, any>();
    clientesList.forEach(cl => {
      if (cl.numeroCliente) clientesMap.set(cl.numeroCliente, cl);
    });

    // Si algún cliente no está en memoria, consultar de Supabase
    const neededClientNumbers = conducesList
      .filter(c => conduceIds.includes(c.id) && c.numeroCliente && !clientesMap.has(c.numeroCliente))
      .map(c => c.numeroCliente);

    if (neededClientNumbers.length > 0) {
      const uniqueNeeded = [...new Set(neededClientNumbers)];
      const { data: fetchedClientes } = await supabase
        .from('clientes')
        .select('numero_cliente, encomendado, ruta, ciudad, razon_social')
        .in('numero_cliente', uniqueNeeded);
      
      if (fetchedClientes) {
        fetchedClientes.forEach(cl => {
          clientesMap.set(cl.numero_cliente, {
            numeroCliente: cl.numero_cliente,
            encomendado: cl.encomendado,
            ruta: cl.ruta,
            ciudad: cl.ciudad,
            razonSocial: cl.razon_social
          });
        });
      }
    }

    // Agrupación de conduces por destino final
    const gruposDestino: Record<string, { ids: string[]; esCamion: boolean; camionBase: string }> = {};
    let countCamion = 0;
    let countAlmacen = 0;
    let countSinAsignar = 0;

    for (const id of conduceIds) {
      const c = conducesList.find(item => item.id === id);
      const cliente = c?.numeroCliente ? clientesMap.get(c.numeroCliente) : null;

      let targetTruck = '';
      if (encomendadoDestino === 'AUTO_CLIENTE') {
        targetTruck = cliente?.encomendado || c?.encomendado || '';
      } else {
        targetTruck = encomendadoDestino;
      }

      if (!targetTruck) {
        countSinAsignar++;
        continue;
      }

      // Si el destino es un almacén específico o general explícito
      if (targetTruck.toLowerCase().includes('almacen')) {
        const dest = targetTruck;
        if (!gruposDestino[dest]) {
          gruposDestino[dest] = { ids: [], esCamion: false, camionBase: getBaseTruck(dest) };
        }
        gruposDestino[dest].ids.push(id);
        countAlmacen++;
        continue;
      }

      // Es un camión: aplicar división inteligente según la ruta de hoy
      const baseTruck = getBaseTruck(targetTruck);
      const rutaHoy = getRutaProgramadaHoy(programacion, baseTruck);
      const conduceRoute = c?.ruta || cliente?.ruta || '0';

      const matches = coincideRutaConProgramacion(conduceRoute, rutaHoy);

      let finalDest = '';
      let isCamion = false;

      if (matches) {
        finalDest = baseTruck;
        isCamion = true;
        countCamion++;
      } else {
        finalDest = getTruckWarehouse(baseTruck);
        isCamion = false;
        countAlmacen++;
      }

      if (!gruposDestino[finalDest]) {
        gruposDestino[finalDest] = { ids: [], esCamion, camionBase: baseTruck };
      }
      gruposDestino[finalDest].ids.push(id);
    }

    // Ejecutar actualizaciones en Supabase por cada grupo
    const updatePromises = Object.entries(gruposDestino).map(async ([dest, info]) => {
      if (info.ids.length === 0) return;

      const targetRegion = getRegionByTruck(dest);
      const payload: any = { encomendado: dest };

      if (targetRegion) {
        payload.region = targetRegion;
      }
      if (options?.prioridad !== undefined) {
        payload.prioridad = options.prioridad;
      }

      const { error } = await supabase
        .from('conduces')
        .update(payload)
        .in('id', info.ids);

      if (error) {
        console.error(`Error actualizando conduces a ${dest}:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);
    clearUltraCache();

    const detalles = Object.entries(gruposDestino).map(([dest, info]) => ({
      destino: dest,
      esCamion: info.esCamion,
      cantidad: info.ids.length,
      camionBase: info.camionBase
    }));

    // Formatear mensaje descriptivo
    let mensaje = '';
    const totalAsignados = countCamion + countAlmacen;
    if (totalAsignados === 0) {
      mensaje = 'No se pudo asignar ningún conduce (verifique el chofer predeterminado).';
    } else if (countAlmacen === 0) {
      mensaje = `${totalAsignados} conduces asignados a Camión directamente según la ruta de hoy.`;
    } else if (countCamion === 0) {
      mensaje = `${totalAsignados} conduces asignados a Almacén porque corresponden a otra ruta.`;
    } else {
      mensaje = `${totalAsignados} conduces asignados: ${countCamion} en Camión (ruta de hoy / ruta 0) y ${countAlmacen} en Almacén (otra ruta).`;
    }

    return {
      success: true,
      total: totalAsignados,
      enCamion: countCamion,
      enAlmacen: countAlmacen,
      sinAsignar: countSinAsignar,
      detalles,
      mensaje
    };
  } catch (err: any) {
    console.error('Error en asignarConducesConDivisionRuta:', err);
    return {
      success: false,
      total: 0,
      enCamion: 0,
      enAlmacen: 0,
      sinAsignar: 0,
      detalles: [],
      mensaje: err?.message || 'Error al asignar los conduces con división de ruta.'
    };
  }
}

export async function transferirConducesAAlmacen(
  conduceIds: string[],
  camion: string
): Promise<{ success: boolean; count: number }> {
  if (conduceIds.length === 0) return { success: true, count: 0 };
  
  const warehouse = getTruckWarehouse(camion);
  const targetRegion = getRegionByTruck(camion);

  try {
    const payload: { encomendado: string; region?: any } = { encomendado: warehouse };
    if (targetRegion) payload.region = targetRegion;

    const { error } = await supabase
      .from('conduces')
      .update(payload)
      .in('id', conduceIds);

    if (error) throw error;
    clearUltraCache();
    return { success: true, count: conduceIds.length };
  } catch (err) {
    console.error('Error transferring to warehouse:', err);
    return { success: false, count: 0 };
  }
}

export async function transferirConducesACamion(
  conduceIds: string[],
  camion: string
): Promise<{ success: boolean; count: number }> {
  if (conduceIds.length === 0) return { success: true, count: 0 };
  
  const baseTruck = getBaseTruck(camion);
  const targetRegion = getRegionByTruck(baseTruck);

  try {
    const payload: { encomendado: string; region?: any } = { encomendado: baseTruck };
    if (targetRegion) payload.region = targetRegion;

    const { error } = await supabase
      .from('conduces')
      .update(payload)
      .in('id', conduceIds);

    if (error) throw error;
    clearUltraCache();
    return { success: true, count: conduceIds.length };
  } catch (err) {
    console.error('Error transferring to truck:', err);
    return { success: false, count: 0 };
  }
}

