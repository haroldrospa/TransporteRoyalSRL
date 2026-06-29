import { format, parse } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface DiaFestivo {
  id: string;
  fecha: string; // YYYY-MM-DD format
  nombre: string;
}

/**
 * Obtiene los días festivos desde Supabase
 */
export const getDiasFestivos = async (): Promise<DiaFestivo[]> => {
  try {
    const { data, error } = await supabase
      .from('dias_festivos')
      .select('*')
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error loading días festivos:', error);
      return [];
    }

    return data.map(dia => ({
      id: dia.id,
      fecha: dia.fecha,
      nombre: dia.nombre
    }));
  } catch (error) {
    console.error('Error loading días festivos:', error);
    return [];
  }
};

/**
 * Agrega un nuevo día festivo a la base de datos
 */
export const agregarDiaFestivo = async (fecha: string, nombre: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('dias_festivos')
      .insert([{ fecha, nombre }]);

    if (error) {
      console.error('Error adding día festivo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding día festivo:', error);
    return false;
  }
};

/**
 * Elimina un día festivo de la base de datos
 */
export const eliminarDiaFestivo = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('dias_festivos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting día festivo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting día festivo:', error);
    return false;
  }
};

/**
 * Verifica si una fecha específica es día festivo
 * @param fecha - Date object o string en formato YYYY-MM-DD
 */
export const esDiaFestivo = async (fecha: Date | string): Promise<boolean> => {
  const diasFestivos = await getDiasFestivos();
  
  let fechaStr: string;
  if (fecha instanceof Date) {
    fechaStr = format(fecha, 'yyyy-MM-dd');
  } else {
    fechaStr = fecha;
  }
  
  return diasFestivos.some(dia => dia.fecha === fechaStr);
};

/**
 * Obtiene todos los días festivos en un rango de fechas
 * @param fechaInicio - Fecha de inicio
 * @param fechaFin - Fecha de fin
 */
export const getDiasFestivosEnRango = async (fechaInicio: Date, fechaFin: Date): Promise<DiaFestivo[]> => {
  const diasFestivos = await getDiasFestivos();
  const inicioStr = format(fechaInicio, 'yyyy-MM-dd');
  const finStr = format(fechaFin, 'yyyy-MM-dd');
  
  return diasFestivos.filter(dia => 
    dia.fecha >= inicioStr && dia.fecha <= finStr
  );
};