import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conduce } from '@/types/conduces';

interface PendingScannedConduce {
  conduce: Conduce;
  missingScans: {
    conduceNotScanned: boolean;
    missingBultos: number;
    scannedBultos: number;
    totalBultos: number;
  };
}

export const usePendingScannedConduces = (userConduces: Conduce[]) => {
  const [pendingScannedConduces, setPendingScannedConduces] = useState<PendingScannedConduce[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPendingScannedConduces = async () => {
      if (!userConduces.length) {
        setPendingScannedConduces([]);
        return;
      }

      setLoading(true);
      try {
        // Obtener los shipments verificados
        const { data: verifiedShipments, error } = await supabase
          .from('verified_shipments')
          .select('*');

        if (error) {
          console.error('Error fetching verified shipments:', error);
          return;
        }

        // Filtrar conduces que están "En tránsito" y tienen encomendado
        const transitConduces = userConduces.filter(
          c => c.estado === 'En tránsito' && c.encomendado
        );

        const pendingItems: PendingScannedConduce[] = [];

        transitConduces.forEach(conduce => {
          // Verificar si el conduce fue escaneado
          const conduceScanned = verifiedShipments?.some(
            vs => vs.conduce_number === conduce.numeroConduce && 
                  vs.scan_type === 'conduce' &&
                  vs.encomendado === conduce.encomendado
          ) || false;

          // Contar bultos escaneados para este conduce
          const scannedBultos = verifiedShipments?.filter(
            vs => vs.conduce_number === conduce.numeroConduce && 
                  vs.scan_type === 'bulto' &&
                  vs.encomendado === conduce.encomendado
          ).length || 0;

          const totalBultos = conduce.cantidadBultos;
          const missingBultos = totalBultos - scannedBultos;

          // Si falta escanear el conduce O faltan bultos (pero solo si el conduce está escaneado)
          const hasIssues = !conduceScanned || (conduceScanned && missingBultos > 0);

          if (hasIssues) {
            pendingItems.push({
              conduce,
              missingScans: {
                conduceNotScanned: !conduceScanned,
                missingBultos: conduceScanned ? Math.max(0, missingBultos) : 0,
                scannedBultos,
                totalBultos
              }
            });
          }
        });

        setPendingScannedConduces(pendingItems);
      } catch (error) {
        console.error('Error processing pending scanned conduces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingScannedConduces();
  }, [userConduces]);

  return {
    pendingScannedConduces,
    loading,
    hasPendingScans: pendingScannedConduces.length > 0
  };
};