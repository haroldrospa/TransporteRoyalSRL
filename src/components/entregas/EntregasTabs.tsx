
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EntregasTabsProps {
  pendingCount: number;
  completedCount: number;
  returnedCount: number;
}

export const EntregasTabs = ({ 
  pendingCount, 
  completedCount, 
  returnedCount 
}: EntregasTabsProps) => {
  return (
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="pending">
        Pendientes ({pendingCount})
      </TabsTrigger>
      <TabsTrigger value="completed">
        Entregados ({completedCount})
      </TabsTrigger>
      <TabsTrigger value="returned">
        Devueltos ({returnedCount})
      </TabsTrigger>
    </TabsList>
  );
};
