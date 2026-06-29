
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type ShipmentStatsRecord = Record<string, string[]>;
type ShipmentBultosRecord = Record<string, number>;
type ShipmentBultoIdsRecord = Record<string, string[]>;

export interface VerifiedShipment {
  id: string;
  conduce_id?: string;
  conduce_number: string;
  encomendado: string;
  scan_type: string;
  verified_at: string;
  bulto_sequence?: number;
  ciudad?: string;
  conduces?: {
    ciudad?: string;
    cantidad_bultos?: number;
  };
  user_id?: string;
  user_name?: string;
}

export function useVerifiedShipmentsData() {
  const [scannedConduces, setScannedConduces] = useState<ShipmentStatsRecord>({});
  const [scannedBultos, setScannedBultos] = useState<ShipmentBultosRecord>({});
  const [scannedBultoIds, setScannedBultoIds] = useState<ShipmentBultoIdsRecord>({});
  const [verifiedShipments, setVerifiedShipments] = useState<VerifiedShipment[]>([]);

  const loadVerifiedShipments = async () => {
    try {
      // Fetch verified shipments from Supabase
      const { data, error } = await supabase
        .from('verified_shipments')
        .select('*, conduces(ciudad, cantidad_bultos)')
        .order('verified_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to include cidade from conduces
      const processedData = data?.map(item => {
        return {
          ...item,
          ciudad: item.conduces?.ciudad || null
        };
      }) || [];
      
      setVerifiedShipments(processedData);
      
      // Process conduces
      const conduces: ShipmentStatsRecord = {};
      const bultos: ShipmentBultosRecord = {};
      const bultoIds: ShipmentBultoIdsRecord = {};
      
      processedData?.forEach(item => {
        const { encomendado, conduce_number, scan_type } = item;
        
        // Initialize records if needed
        if (!conduces[encomendado]) conduces[encomendado] = [];
        if (!bultos[encomendado]) bultos[encomendado] = 0;
        if (!bultoIds[encomendado]) bultoIds[encomendado] = [];
        
        // Add conduce if not already included
        if (scan_type === 'conduce' && !conduces[encomendado].includes(conduce_number)) {
          conduces[encomendado] = [...conduces[encomendado], conduce_number];
        }
        
        // Count bulto
        if (scan_type === 'bulto') {
          bultos[encomendado]++;
          const bultoId = `${conduce_number}-${item.bulto_sequence}`;
          bultoIds[encomendado] = [...bultoIds[encomendado], bultoId];
        }
      });
      
      setScannedConduces(conduces);
      setScannedBultos(bultos);
      setScannedBultoIds(bultoIds);
      
    } catch (error) {
      console.error('Error loading verified shipments:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los envíos verificados",
        variant: "destructive"
      });
    }
  };

  // Load data on mount
  useEffect(() => {
    loadVerifiedShipments();
  }, []);

  return {
    scannedConduces,
    setScannedConduces,
    scannedBultos,
    setScannedBultos,
    scannedBultoIds,
    setScannedBultoIds,
    verifiedShipments,
    setVerifiedShipments,
    loadVerifiedShipments
  };
}
