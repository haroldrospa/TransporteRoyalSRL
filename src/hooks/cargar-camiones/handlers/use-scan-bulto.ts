
import { useState } from 'react';
import { Conduce } from '@/types/conduces';
import { supabase } from '@/integrations/supabase/client';
import { getUserInfo, type CurrentUser } from '../utils/user-info-utils';

interface UseScanBultoProps {
  conduces: Conduce[];
  loadVerifiedShipments: () => Promise<void>;
  setScannedBultos: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setScannedBultoIds: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  currentUser?: CurrentUser | null;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  isProcessing: boolean;
}

// Helper function to emit status messages
const emitStatusMessage = (text: string, type: 'success' | 'info' | 'warning' | 'error') => {
  const event = new CustomEvent('scan-status-message', {
    detail: { text, type }
  });
  window.dispatchEvent(event);
};

export function useScanBulto({
  conduces,
  loadVerifiedShipments,
  setScannedBultos,
  setScannedBultoIds,
  currentUser,
  setIsProcessing,
  isProcessing
}: UseScanBultoProps) {
  
  const handleScanBulto = async (encomendado: string, bultoId: string, conduceNumber: string) => {
    if (isProcessing) {
      console.log('Ya existe un proceso en curso, ignorando escaneo');
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`Escaneando bulto: ${bultoId} para conduce: ${conduceNumber}, encomendado: ${encomendado}`);
      const conduce = conduces.find(c => c.numeroConduce === conduceNumber);
      
      if (!conduce) {
        emitStatusMessage(`No se encontró el conduce ${conduceNumber} para este bulto`, 'warning');
        console.log('No se encontró el conduce en la base de datos local');
        setIsProcessing(false);
        return;
      }
      
      if (!conduce.encomendado) {
        emitStatusMessage(`El conduce ${conduceNumber} no está asignado a ningún camión`, 'warning');
        setIsProcessing(false);
        return;
      }
      
      // Get user info
      const { user_id, user_name } = getUserInfo(currentUser);
      
      // Check how many bultos have been scanned for this conduce
      const { data: existingBultos } = await supabase
        .from('verified_shipments')
        .select('id, bulto_sequence, encomendado')
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'bulto');
      
      const scannedBultosForConduce = existingBultos?.length || 0;
      console.log(`Bultos ya escaneados para este conduce: ${scannedBultosForConduce}`);
      
      // Check if this specific bulto sequence was already scanned
      const bultoSequenceMatch = bultoId.match(/-(\d+)$/);
      if (bultoSequenceMatch) {
        const requestedSequence = parseInt(bultoSequenceMatch[1]);
        const alreadyScanned = existingBultos?.find(b => b.bulto_sequence === requestedSequence);
        
        if (alreadyScanned) {
          // Dispatch duplicate event
          window.dispatchEvent(new CustomEvent('scan-duplicate', {
            detail: {
              scanType: 'bulto',
              conduceNumber,
              encomendado: alreadyScanned.encomendado
            }
          }));
          
          emitStatusMessage(`El bulto ${requestedSequence} del conduce ${conduceNumber} ya fue escaneado para: ${alreadyScanned.encomendado}`, 'warning');
          setIsProcessing(false);
          return;
        }
      }
      
      // VALIDATE: Prevent scanning more bultos than the conduce should have
      if (scannedBultosForConduce >= conduce.cantidadBultos) {
        emitStatusMessage(`Ya se han escaneado todos los bultos del conduce ${conduceNumber} (${conduce.cantidadBultos}/${conduce.cantidadBultos})`, 'warning');
        console.log(`Prevención de exceso: Ya se han escaneado ${scannedBultosForConduce} de ${conduce.cantidadBultos} bultos`);
        setIsProcessing(false);
        return;
      }
      
      const nextBultoSequence = scannedBultosForConduce + 1;
      
      // Registrar el nuevo bulto
      const { error } = await supabase.from('verified_shipments').insert({
        conduce_id: conduce?.id || null,
        conduce_number: conduceNumber,
        encomendado,
        scan_type: 'bulto',
        bulto_sequence: nextBultoSequence,
        user_id,
        user_name
      });
      
      if (error) throw error;
      
      // Actualizar el estado local
      setScannedBultos(prev => {
        const updatedScannedBultos = { ...prev };
        if (!updatedScannedBultos[encomendado]) {
          updatedScannedBultos[encomendado] = 0;
        }
        updatedScannedBultos[encomendado] += 1;
        return updatedScannedBultos;
      });
      
      setScannedBultoIds(prev => {
        const updatedScannedBultoIds = { ...prev };
        if (!updatedScannedBultoIds[encomendado]) {
          updatedScannedBultoIds[encomendado] = [];
        }
        const newBultoId = `${conduceNumber}-${nextBultoSequence}`;
        updatedScannedBultoIds[encomendado] = [...updatedScannedBultoIds[encomendado], newBultoId];
        return updatedScannedBultoIds;
      });
      
      await loadVerifiedShipments();
      
      // Inform the user about remaining bultos
      const remainingBultos = conduce.cantidadBultos - nextBultoSequence;
      const message = remainingBultos > 0 
        ? `✓ Bulto ${nextBultoSequence} del conduce ${conduceNumber} escaneado para: ${encomendado}. Quedan ${remainingBultos} bultos por escanear.`
        : `✓ Bulto ${nextBultoSequence} del conduce ${conduceNumber} escaneado para: ${encomendado}. Todos los bultos completados (${nextBultoSequence}/${conduce.cantidadBultos}).`;
      
      emitStatusMessage(message, 'success');
      
      console.log('Bulto registrado correctamente');
    } catch (error) {
      console.error('Error storing verified bulto:', error);
      emitStatusMessage(`Error al registrar el bulto para el conduce ${conduceNumber}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleScanBulto
  };
}
