
import { supabase } from '@/integrations/supabase/client';
import { fetchClientes } from './clienteService';
import { fetchConduces } from './conduceService';

export const importMockData = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('import_mock_data');
    
    if (error) {
      console.error('Error importing mock data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error importing mock data:', error);
    throw error;
  }
};

export const refreshData = async () => {
  try {
    await Promise.all([
      fetchClientes(),
      fetchConduces()
    ]);
  } catch (error) {
    console.error('Error refreshing data:', error);
    throw error;
  }
};
