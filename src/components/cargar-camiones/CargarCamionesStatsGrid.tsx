
import { Truck } from 'lucide-react';
import EncomendadoStatusGrid from './EncomendadoStatusGrid';

interface CargarCamionesStatsGridProps {
  encomendadoStats: Record<string, { 
    conduces: number, 
    bultos: number, 
    scannedConduces: number, 
    scannedBultos: number,
    clientCount?: number,
    priorityConduces?: number,
    priorityDetails?: any[]
  }>;
  onEncomendadoClick: (encomendado: string) => void;
  loading?: boolean;
}

const CargarCamionesStatsGrid = ({ 
  encomendadoStats, 
  onEncomendadoClick,
  loading = false
}: CargarCamionesStatsGridProps) => {
  if (loading) {
    return (
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold mb-5 text-gray-800 border-l-4 border-green-500 pl-3">
          <Truck className="h-5 w-5 text-green-600" />
          Estado de Camiones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-5 bg-gray-50/60 animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if there are any active trucks with conduces
  const hasActiveEncomendados = Object.values(encomendadoStats)
    .some(stats => stats.conduces > 0);
  
  if (!hasActiveEncomendados && Object.keys(encomendadoStats).length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No hay camiones asignados para cargar</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-bold mb-5 text-gray-800 border-l-4 border-green-500 pl-3">
        <Truck className="h-5 w-5 text-green-600" />
        Estado de Camiones
      </h2>
      <EncomendadoStatusGrid 
        encomendadoStats={encomendadoStats} 
        onEncomendadoClick={onEncomendadoClick}
      />
    </div>
  );
};

export default CargarCamionesStatsGrid;
