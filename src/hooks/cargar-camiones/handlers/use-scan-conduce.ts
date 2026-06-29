import { useState } from 'react';
import { Conduce } from '@/types/conduces';
import { toast } from '@/hooks/use-toast';
import { type CurrentUser } from '../utils/user-info-utils';
import { updateConduceRelation, saveConduceRelation } from '@/services/conduces/relationOperations';
import { recordVerifiedShipment } from '@/services/shipments/verifiedShipmentOperations';
import { supabase } from '@/integrations/supabase/client';

interface UseScanConduceProps {
  conduces: Conduce[];
  loadVerifiedShipments: () => Promise<void>;
  setScannedConduces: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  currentUser?: CurrentUser | null;
  setIsProcessing: (processing: boolean) => void;
  isProcessing: boolean;
  selectedRelacion?: string;
}

export function useScanConduce({
  conduces,
  loadVerifiedShipments,
  setScannedConduces,
  currentUser,
  setIsProcessing,
  isProcessing,
  selectedRelacion
}: UseScanConduceProps) {

  const handleScanConduce = async (encomendado: string, conduceNumber: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Find the conduce in the data
      const conduce = conduces.find(c => c.numeroConduce === conduceNumber);
      
      if (!conduce) {
        toast({
          title: "Error",
          description: `No se encontró el conduce ${conduceNumber}`,
          variant: "destructive"
        });
        return;
      }

      // Check if this conduce was already scanned
      const { data: existingScans } = await supabase
        .from('verified_shipments')
        .select('*')
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'conduce');

      if (existingScans && existingScans.length > 0) {
        const existingScan = existingScans[0];
        // Emit a duplicate warning with the encomendado info
        window.dispatchEvent(new CustomEvent('scan-duplicate', {
          detail: {
            scanType: 'conduce',
            conduceNumber,
            encomendado: existingScan.encomendado
          }
        }));
        
        toast({
          title: "⚠️ Conduce Ya Escaneado",
          description: `El conduce ${conduceNumber} ya fue escaneado para: ${existingScan.encomendado}`,
          variant: "default"
        });
        
        setIsProcessing(false);
        return;
      }

      // Check if conduce already has a different relation assigned
      const previousRelacion = conduce.relacion;
      
      // If conduce has a different relation, just scan without reassigning
      if (previousRelacion && previousRelacion !== selectedRelacion) {
        console.log(`Conduce ${conduceNumber} ya está asignado a relación ${previousRelacion}, escaneando sin reasignar`);
        
        // Record the verified shipment without changing relation
        await recordVerifiedShipment(conduceNumber, encomendado, currentUser);

        // Update local state
        setScannedConduces(prev => ({
          ...prev,
          [encomendado]: [...(prev[encomendado] || []), conduceNumber]
        }));

        // Reload verified shipments
        await loadVerifiedShipments();

        toast({
          title: "✓ Conduce Verificado",
          description: `Conduce ${conduceNumber} escaneado para encomendado: ${encomendado} (mantiene relación ${previousRelacion})`,
        });
        
        // Emit status message for display
        window.dispatchEvent(new CustomEvent('scan-status-message', {
          detail: {
            text: `✓ Conduce ${conduceNumber} escaneado exitosamente para: ${encomendado}`,
            type: 'success'
          }
        }));
        
        return;
      }

      // Update the conduce with the selected relation (only if it doesn't have one or it's the same)
      if (selectedRelacion && !previousRelacion) {
        await updateConduceRelation(conduceNumber, selectedRelacion);
        
        // Try to save it to the relaciones system - but don't fail if it errors
        try {
          await saveConduceRelation(conduceNumber, selectedRelacion, currentUser?.id || '');
        } catch (relationError) {
          console.warn('Warning saving conduce relation (continuing anyway):', relationError);
          // Don't throw - continue with the rest of the process
        }
      }

      // Record the verified shipment
      await recordVerifiedShipment(conduceNumber, encomendado, currentUser);

      // Update local state
      setScannedConduces(prev => ({
        ...prev,
        [encomendado]: [...(prev[encomendado] || []), conduceNumber]
      }));

      // Reload verified shipments
      await loadVerifiedShipments();

      // Show success message
      const successMessage = selectedRelacion && !previousRelacion
        ? `Conduce ${conduceNumber} escaneado y asignado a relación ${selectedRelacion}`
        : `Conduce ${conduceNumber} escaneado correctamente`;

      toast({
        title: "✓ Conduce Escaneado",
        description: `Conduce ${conduceNumber} escaneado para encomendado: ${encomendado}`,
      });
      
      // Emit status message for display
      window.dispatchEvent(new CustomEvent('scan-status-message', {
        detail: {
          text: `✓ Conduce ${conduceNumber} escaneado exitosamente para: ${encomendado}`,
          type: 'success'
        }
      }));

    } catch (error) {
      console.error('Error scanning conduce:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el escaneo del conduce",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { handleScanConduce };
}