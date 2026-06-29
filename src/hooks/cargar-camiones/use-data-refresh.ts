
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export interface UseDataRefreshProps {
  refreshData: () => Promise<void>;
  loadVerifiedShipments: () => Promise<void>;
}

export function useDataRefresh({ refreshData, loadVerifiedShipments }: UseDataRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshData(), loadVerifiedShipments()]);
      toast({
        title: "Datos actualizados",
        description: "Los datos han sido actualizados correctamente"
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    handleRefreshData
  };
}
