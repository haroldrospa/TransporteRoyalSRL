import { supabase } from '@/integrations/supabase/client';
import { EntregaLAM } from '@/types/entregasLam';

export const fetchEntregasLAM = async (): Promise<EntregaLAM[]> => {
  const { data, error } = await supabase
    .from('entregas_lam')
    .select('*')
    .order('fecha_recogida', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(item => ({
    id: item.id,
    cliente: item.cliente,
    cantidad_bultos: item.cantidad_bultos,
    firma_despachador: item.firma_despachador,
    imagen_conduce: item.imagen_conduce,
    fecha_recogida: item.fecha_recogida,
    created_at: item.created_at,
    updated_at: item.updated_at,
    usuario_id: item.usuario_id,
    usuario_nombre: item.usuario_nombre,
    notas: item.notas
  }));
};

export const createEntregaLAM = async (
  entrega: Omit<EntregaLAM, 'id' | 'created_at' | 'updated_at'>
): Promise<EntregaLAM> => {
  const { data, error } = await supabase
    .from('entregas_lam')
    .insert([entrega])
    .select()
    .single();

  if (error) throw error;
  return data as EntregaLAM;
};

export const deleteEntregaLAM = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('entregas_lam')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
