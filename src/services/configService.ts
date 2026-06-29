import { supabase } from '@/integrations/supabase/client';

export interface AppConfig {
  id: string;
  gasoil_price: number;
  admin_emails: string[];
}

export const fetchAppConfig = async (): Promise<AppConfig | null> => {
  const { data, error } = await supabase
    .from('app_config')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching app config:', error);
    return null;
  }

  return data as AppConfig;
};

export const saveAppConfig = async (gasoilPrice: number, adminEmails: string[]): Promise<boolean> => {
  try {
    const existingConfig = await fetchAppConfig();

    if (existingConfig) {
      const { error } = await supabase
        .from('app_config')
        .update({
          gasoil_price: gasoilPrice,
          admin_emails: adminEmails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('app_config')
        .insert([{
          gasoil_price: gasoilPrice,
          admin_emails: adminEmails,
        }]);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving app config:', error);
    return false;
  }
};
