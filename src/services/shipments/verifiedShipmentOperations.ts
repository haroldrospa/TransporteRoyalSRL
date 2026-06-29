
import { supabase } from '@/integrations/supabase/client';
import { type CurrentUser } from '@/hooks/cargar-camiones/utils/user-info-utils';

export async function recordVerifiedShipment(
  conduceNumber: string, 
  encomendado: string, 
  currentUser?: CurrentUser | null
) {
  const { error: shipmentError } = await supabase
    .from('verified_shipments')
    .insert({
      conduce_number: conduceNumber,
      encomendado: encomendado,
      scan_type: 'conduce',
      user_id: currentUser?.id,
      user_name: currentUser?.nombre ? `${currentUser.nombre} ${currentUser.apellido || ''}` : undefined,
    });

  if (shipmentError) {
    console.error('Error recording shipment:', shipmentError);
    throw new Error('Error al registrar el envío');
  }
}
