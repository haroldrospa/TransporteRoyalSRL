import { supabase } from '@/integrations/supabase/client';

export interface ChoferBudget {
  id: string;
  chofer_id: string;
  chofer_nombre: string;
  fecha: string;
  total_distancia_km: number;
  total_bultos: number;
  total_conduces: number;
  tiempo_estimado_min: number;
  combustible_galones: number;
  combustible_costo: number;
  created_at: string;
}

export const insertChoferBudget = async (budget: Omit<ChoferBudget, 'id' | 'created_at' | 'fecha'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('choferes_budget')
      .insert([budget]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving driver budget:', error);
    return false;
  }
};

export const fetchChoferesBudget = async (): Promise<ChoferBudget[]> => {
  try {
    const { data, error } = await supabase
      .from('choferes_budget')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw error;
    return (data || []) as ChoferBudget[];
  } catch (error) {
    console.error('Error fetching driver budgets:', error);
    return [];
  }
};

export const deleteChoferBudget = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('choferes_budget')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting driver budget:', error);
    return false;
  }
};
