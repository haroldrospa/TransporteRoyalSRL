import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { canDeleteRecords } from '@/utils/userPermissions';

interface UseShipmentDeletionProps {
  setScannedConduces: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setScannedBultos: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setScannedBultoIds: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setVerifiedShipments: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useShipmentDeletion({
  setScannedConduces,
  setScannedBultos,
  setScannedBultoIds,
  setVerifiedShipments
}: UseShipmentDeletionProps) {
  const { user } = useAuth();
  
  // Clear only conduce shipments
  const clearConducesOnly = async () => {
    if (!canDeleteRecords(user)) {
      console.error('🚫 [clearConducesOnly] Acceso denegado - Usuario no es administrador');
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden eliminar todos los registros",
        variant: "destructive"
      });
      return { success: false, error: 'Permisos insuficientes' };
    }
    
    try {
      console.log('🗑️ [clearConducesOnly] Starting deletion of all conduce shipments...');
      
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('scan_type', 'conduce');
      
      if (error) {
        console.error('❌ [clearConducesOnly] Database deletion error:', error);
        toast({
          title: "Error",
          description: `No se pudieron eliminar los registros: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('✅ [clearConducesOnly] Successfully deleted all conduce shipments');
      
      // Reset only conduce state
      setScannedConduces({});
      setVerifiedShipments(prev => prev.filter(item => item.scan_type !== 'conduce'));
      
      toast({
        title: "Éxito",
        description: "Todos los conduces han sido eliminados correctamente",
      });
      
      return { success: true };
    } catch (error) {
      console.error('💥 [clearConducesOnly] Exception:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los registros. Por favor, intente nuevamente.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Clear only bulto shipments
  const clearBultosOnly = async () => {
    if (!canDeleteRecords(user)) {
      console.error('🚫 [clearBultosOnly] Acceso denegado - Usuario no es administrador');
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden eliminar todos los registros",
        variant: "destructive"
      });
      return { success: false, error: 'Permisos insuficientes' };
    }
    
    try {
      console.log('🗑️ [clearBultosOnly] Starting deletion of all bulto shipments...');
      
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('scan_type', 'bulto');
      
      if (error) {
        console.error('❌ [clearBultosOnly] Database deletion error:', error);
        toast({
          title: "Error",
          description: `No se pudieron eliminar los registros: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('✅ [clearBultosOnly] Successfully deleted all bulto shipments');
      
      // Reset only bulto state
      setScannedBultos({});
      setScannedBultoIds({});
      setVerifiedShipments(prev => prev.filter(item => item.scan_type !== 'bulto'));
      
      toast({
        title: "Éxito",
        description: "Todos los bultos han sido eliminados correctamente",
      });
      
      return { success: true };
    } catch (error) {
      console.error('💥 [clearBultosOnly] Exception:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los registros. Por favor, intente nuevamente.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Clear all verified shipments (both conduces and bultos)
  const clearVerifiedShipments = async () => {
    if (!canDeleteRecords(user)) {
      console.error('🚫 [clearVerifiedShipments] Acceso denegado - Usuario no es administrador');
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden eliminar todos los registros",
        variant: "destructive"
      });
      return { success: false, error: 'Permisos insuficientes' };
    }
    
    try {
      console.log('🗑️ [clearVerifiedShipments] Starting deletion of all verified shipments...');
      
      const { data: existingData, error: checkError } = await supabase
        .from('verified_shipments')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('❌ [clearVerifiedShipments] Error checking existing records:', checkError);
        toast({
          title: "Error",
          description: `Error al verificar registros: ${checkError.message}`,
          variant: "destructive"
        });
        throw checkError;
      }
      
      if (!existingData || existingData.length === 0) {
        console.log('ℹ️ [clearVerifiedShipments] No records to delete');
        toast({
          title: "Información",
          description: "No hay registros para eliminar",
        });
        return { success: true };
      }
      
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.error('❌ [clearVerifiedShipments] Database deletion error:', error);
        toast({
          title: "Error",
          description: `No se pudieron eliminar los registros: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('✅ [clearVerifiedShipments] Successfully deleted all verified shipments');
      
      setScannedConduces({});
      setScannedBultos({});
      setScannedBultoIds({});
      setVerifiedShipments([]);
      
      toast({
        title: "Éxito",
        description: "Todos los registros han sido eliminados correctamente",
      });
      
      return { success: true };
    } catch (error) {
      console.error('💥 [clearVerifiedShipments] Exception:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los registros. Por favor, intente nuevamente.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Delete only conduce scan for a specific conduce number (keeps bultos)
  const deleteConduceShipment = async (conduceNumber: string) => {
    if (!canDeleteRecords(user)) {
      console.error('🚫 [deleteConduceShipment] Acceso denegado - Usuario no es administrador');
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden eliminar registros",
        variant: "destructive"
      });
      return { success: false, error: 'Permisos insuficientes' };
    }
    
    try {
      console.log(`🗑️ [deleteConduceShipment] Deleting conduce scan: ${conduceNumber}`);
      
      const { data: shipmentData, error: fetchError } = await supabase
        .from('verified_shipments')
        .select('*')
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'conduce');
      
      if (fetchError) {
        console.error('❌ [deleteConduceShipment] Error fetching shipments:', fetchError);
        toast({
          title: "Error",
          description: `Error al buscar registros: ${fetchError.message}`,
          variant: "destructive"
        });
        return { success: false, error: fetchError };
      }
      
      if (!shipmentData || shipmentData.length === 0) {
        console.log(`ℹ️ [deleteConduceShipment] No conduce records found for: ${conduceNumber}`);
        toast({
          title: "Información",
          description: "No hay registros de conduce para eliminar",
        });
        return { success: true, message: 'No records to delete' };
      }
      
      const affectedEncomendados = new Set(shipmentData.map(item => item.encomendado));
      
      const { error: deleteError } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'conduce');
      
      if (deleteError) {
        console.error('❌ [deleteConduceShipment] Database deletion error:', deleteError);
        toast({
          title: "Error",
          description: `No se pudo eliminar el registro: ${deleteError.message}`,
          variant: "destructive"
        });
        return { success: false, error: deleteError };
      }
      
      console.log(`✅ [deleteConduceShipment] Successfully deleted conduce scan: ${conduceNumber}`);
      
      affectedEncomendados.forEach(encomendado => {
        setScannedConduces(prev => {
          if (!prev[encomendado]) return prev;
          const updatedConduces = prev[encomendado].filter(code => code !== conduceNumber);
          return { ...prev, [encomendado]: updatedConduces };
        });
      });
      
      setVerifiedShipments(prev => 
        prev.filter(item => !(item.conduce_number === conduceNumber && item.scan_type === 'conduce'))
      );
      
      toast({
        title: "Éxito",
        description: `Escaneo de conduce eliminado: ${conduceNumber}`,
      });
      
      return { success: true };
    } catch (error) {
      console.error('💥 [deleteConduceShipment] Exception:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro. Por favor, intente nuevamente.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Delete only bulto scans for a specific conduce number (keeps conduce scan)
  const deleteBultoShipment = async (conduceNumber: string) => {
    if (!canDeleteRecords(user)) {
      console.error('🚫 [deleteBultoShipment] Acceso denegado - Usuario no es administrador');
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden eliminar registros",
        variant: "destructive"
      });
      return { success: false, error: 'Permisos insuficientes' };
    }
    
    try {
      console.log(`🗑️ [deleteBultoShipment] Deleting bulto scans for conduce: ${conduceNumber}`);
      
      const { data: shipmentData, error: fetchError } = await supabase
        .from('verified_shipments')
        .select('*')
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'bulto');
      
      if (fetchError) {
        console.error('❌ [deleteBultoShipment] Error fetching shipments:', fetchError);
        toast({
          title: "Error",
          description: `Error al buscar registros: ${fetchError.message}`,
          variant: "destructive"
        });
        return { success: false, error: fetchError };
      }
      
      if (!shipmentData || shipmentData.length === 0) {
        console.log(`ℹ️ [deleteBultoShipment] No bulto records found for: ${conduceNumber}`);
        toast({
          title: "Información",
          description: "No hay registros de bultos para eliminar",
        });
        return { success: true, message: 'No records to delete' };
      }
      
      const affectedEncomendados = new Set(shipmentData.map(item => item.encomendado));
      
      const { error: deleteError } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'bulto');
      
      if (deleteError) {
        console.error('❌ [deleteBultoShipment] Database deletion error:', deleteError);
        toast({
          title: "Error",
          description: `No se pudo eliminar el registro: ${deleteError.message}`,
          variant: "destructive"
        });
        return { success: false, error: deleteError };
      }
      
      console.log(`✅ [deleteBultoShipment] Successfully deleted bulto scans for: ${conduceNumber}`);
      
      affectedEncomendados.forEach(encomendado => {
        setScannedBultos(prev => {
          const newBultos = { ...prev };
          delete newBultos[conduceNumber];
          return newBultos;
        });
        
        setScannedBultoIds(prev => {
          const newBultoIds = { ...prev };
          delete newBultoIds[conduceNumber];
          return newBultoIds;
        });
      });
      
      setVerifiedShipments(prev => 
        prev.filter(item => !(item.conduce_number === conduceNumber && item.scan_type === 'bulto'))
      );
      
      toast({
        title: "Éxito",
        description: `Escaneos de bultos eliminados para conduce: ${conduceNumber}`,
      });
      
      return { success: true };
    } catch (error) {
      console.error('💥 [deleteBultoShipment] Exception:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro. Por favor, intente nuevamente.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  // Legacy function for backward compatibility
  const deleteShipment = deleteConduceShipment;

  return { 
    clearVerifiedShipments, 
    clearConducesOnly,
    clearBultosOnly,
    deleteShipment,
    deleteConduceShipment,
    deleteBultoShipment
  };
}
