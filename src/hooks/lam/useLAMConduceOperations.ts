
import { useData } from '@/contexts/DataContext';
import { Conduce, Region } from '@/types/conduces';

export const useLAMConduceOperations = () => {
  const { updateConduce, refreshData, setRegionActual } = useData();

  const handleSaveConduceChanges = async (selectedConduce: Conduce | null, updates: Partial<Conduce>) => {
    if (!selectedConduce) return false;

    try {
      console.log('Updating conduce with:', updates);
      
      // Check if bultos have been modified and set the appropriate flags
      if (updates.cantidadEntregados !== undefined) {
        // Ensure both bultoModificado and bultoModificacionNota are set consistently
        updates.bultoModificado = updates.cantidadEntregados !== selectedConduce.cantidadBultos;
      }

      const result = await updateConduce(selectedConduce.id, updates);
      console.log('Update result:', result);
      // Fix: Check if result exists instead of using it directly in a boolean expression
      return result !== null && result !== undefined;
    } catch (error) {
      console.error('Error updating conduce:', error);
      return false;
    }
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  // Function to toggle region
  const handleRegionChange = (region: Region) => {
    setRegionActual(region);
  };

  return {
    handleSaveConduceChanges,
    handleRefresh,
    handleRegionChange
  };
};
