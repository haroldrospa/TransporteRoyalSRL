import { supabase } from '@/integrations/supabase/client';

export interface AppConfig {
  id: string;
  gasoil_price: number;
  admin_emails: string[];
  carto_api_key?: string;
}

export const getStoredCartoApiKey = (): string => {
  return localStorage.getItem('carto_api_key') || '';
};

export const getMapTileUrl = (isDark: boolean, customKey?: string): string => {
  const key = (customKey !== undefined ? customKey : getStoredCartoApiKey()).trim();
  if (key) {
    return isDark
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`
      : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`;
  }
  // Si no hay API key configurada, usar OpenStreetMap estándar para evitar marcas de agua
  return isDark
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

export const fetchAppConfig = async (): Promise<AppConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching app config:', error);
    }

    // Fetch carto_api_key from settings table
    let cartoApiKey = localStorage.getItem('carto_api_key') || '';
    try {
      const { data: settingData } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'carto_api_key')
        .maybeSingle();

      if (settingData?.value !== undefined && settingData?.value !== null) {
        cartoApiKey = settingData.value;
        localStorage.setItem('carto_api_key', cartoApiKey);
      }
    } catch (e) {
      console.warn('Error fetching carto_api_key from settings:', e);
    }

    if (!data) {
      return {
        id: '',
        gasoil_price: 200,
        admin_emails: ['Haroldrospa@gmail.com'],
        carto_api_key: cartoApiKey,
      };
    }

    return {
      ...(data as AppConfig),
      carto_api_key: cartoApiKey,
    };
  } catch (err) {
    console.error('fetchAppConfig error:', err);
    return null;
  }
};

export const saveAppConfig = async (
  gasoilPrice: number, 
  adminEmails: string[],
  cartoApiKey?: string
): Promise<boolean> => {
  try {
    const existingConfig = await fetchAppConfig();

    if (existingConfig && existingConfig.id) {
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

    // Save carto_api_key to settings table
    if (cartoApiKey !== undefined) {
      localStorage.setItem('carto_api_key', cartoApiKey);
      await supabase
        .from('settings')
        .upsert({
          id: 'carto_api_key',
          value: cartoApiKey.trim(),
          updated_at: new Date().toISOString(),
        });
    }

    return true;
  } catch (error) {
    console.error('Error saving app config:', error);
    return false;
  }
};

