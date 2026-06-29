import { Package, Truck, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Conduce } from '@/types/conduces';

interface EntregasStatsGridProps {
  stats: {
    totalClientes: number;
    totalBultos: number;
    totalConduces: number;
  };
  pendingDeliveries: Conduce[];
  isAdmin?: boolean;
}

export const EntregasStatsGrid = ({
  stats,
  pendingDeliveries,
  isAdmin = false
}: EntregasStatsGridProps) => {
  const priorityCount = pendingDeliveries.filter(d => d.prioridad).length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Clientes */}
      <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-royal-blue/30 transition-all">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-royal-blue rounded-xl shadow-sm">
              <Truck className="h-6 w-6 text-royal-yellow" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Clientes</p>
              <p className="text-3xl font-bold text-royal-blue leading-none">{stats.totalClientes}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bultos */}
      <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-royal-blue/30 transition-all">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-royal-blue rounded-xl shadow-sm">
              <Package className="h-6 w-6 text-royal-yellow" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Bultos</p>
              <p className="text-3xl font-bold text-royal-blue leading-none">{stats.totalBultos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pendientes */}
      <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-royal-blue/30 transition-all">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-royal-blue rounded-xl shadow-sm">
              <Clock className="h-6 w-6 text-royal-yellow" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Pendientes</p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-royal-blue leading-none">{pendingDeliveries.length}</p>
                {priorityCount > 0 && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs px-2 py-0.5 rounded-md">
                    {priorityCount} prioritarias
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};