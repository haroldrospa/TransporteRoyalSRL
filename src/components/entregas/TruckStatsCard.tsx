
import { Users, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TruckStatsCardProps {
  truckStats: Record<string, { conduces: number; bultos: number; clientCount: number }>;
  currentCamion: string | undefined;
}

export const TruckStatsCard = ({ truckStats, currentCamion }: TruckStatsCardProps) => {
  // Only show stats if we have data and the user has a truck assigned
  if (!truckStats || !currentCamion || !truckStats[currentCamion]) {
    return null;
  }
  
  const stats = truckStats[currentCamion];
  
  return (
    <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="font-bold">{currentCamion}</span>
          <span className="text-sm font-normal text-muted-foreground">
            - Sus entregas pendientes hoy
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <div>
              <span className="text-xl font-bold">{stats.clientCount}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {stats.clientCount === 1 ? 'cliente' : 'clientes'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            <div>
              <span className="text-xl font-bold">{stats.bultos}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {stats.bultos === 1 ? 'bulto' : 'bultos'} asignados
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
