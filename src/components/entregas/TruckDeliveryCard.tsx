import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, FileText } from 'lucide-react';
import { TruckDeliveryStats } from '@/hooks/useTruckDeliveryStats';

interface TruckDeliveryCardProps {
  truckName: string;
  stats: TruckDeliveryStats;
}

export const TruckDeliveryCard = ({ truckName, stats }: TruckDeliveryCardProps) => {
  return (
    <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground">
          {truckName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clientes</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{stats.clientCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Bultos</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{stats.bultos}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pendientes</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{stats.conduces}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
