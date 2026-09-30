
import { Package, Truck, Warehouse, FileText, Users, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Conduce } from '@/types/conduces';

interface EncomendadoStatusProps {
  encomendado: string;
  stats: {
    conduces: number;
    bultos: number;
    scannedConduces: number;
    scannedBultos: number;
    clientCount?: number;
    priorityConduces?: number;
    priorityDetails?: Conduce[];
  };
  onClick: () => void;
}

const EncomendadoStatusCard = ({ encomendado, stats, onClick }: EncomendadoStatusProps) => {
  const isComplete = stats.scannedConduces === stats.conduces && stats.scannedBultos === stats.bultos;
  const inProgress = stats.scannedConduces > 0 || stats.scannedBultos > 0;
  const conduceProgress = stats.conduces > 0 ? (stats.scannedConduces / stats.conduces) * 100 : 0;
  const bultoProgress = stats.bultos > 0 ? (stats.scannedBultos / stats.bultos) * 100 : 0;
  const hasPriority = (stats.priorityConduces || 0) > 0;
  const isWh = encomendado.toLowerCase().includes('almacen');
  
  return (
    <div 
      className={`relative overflow-hidden rounded-lg shadow-md transition-all hover:shadow-lg cursor-pointer border-l-4 ${
        isWh ? 'border-l-amber-500' : 'border-l-green-500'
      }`}
      onClick={onClick}
    >
      <div className={`p-5 ${isComplete ? 'bg-green-50' : inProgress ? 'bg-blue-50' : isWh ? 'bg-amber-50/30' : 'bg-gray-50'}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isComplete ? 'bg-green-100' : isWh ? 'bg-amber-100' : 'bg-blue-100'}`}>
              {isWh ? (
                <Warehouse className={`h-6 w-6 ${isComplete ? 'text-green-600' : 'text-amber-600'}`} />
              ) : (
                <Truck className={`h-6 w-6 ${isComplete ? 'text-green-600' : 'text-blue-600'}`} />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-1.5">{encomendado}</h3>
              {isWh && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                  Almacén
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {hasPriority && (
              <Badge variant="destructive" className="text-xs font-medium py-1 px-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.priorityConduces} Prioridad
              </Badge>
            )}
            {isComplete && (
              <Badge variant="default" className="bg-green-600 text-xs font-medium py-1 px-3">
                Completado
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-700" />
            <span className="text-sm font-medium text-gray-700">
              {stats.conduces} {stats.conduces === 1 ? "conduce" : "conduces"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-700" />
            <span className="text-sm font-medium text-gray-700">
              {stats.clientCount || 0} {(stats.clientCount || 0) === 1 ? "cliente" : "clientes"}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-gray-600">Conduces</span>
              <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                {stats.scannedConduces} / {stats.conduces}
              </span>
            </div>
            <Progress 
              value={conduceProgress} 
              className="h-2.5 bg-gray-200"
              indicatorClassName={isComplete ? "bg-green-500" : "bg-blue-500"}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                Bultos
              </span>
              <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                {stats.scannedBultos} / {stats.bultos}
              </span>
            </div>
            <Progress 
              value={bultoProgress} 
              className="h-2.5 bg-gray-200"
              indicatorClassName={isComplete ? "bg-green-500" : "bg-blue-500"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncomendadoStatusCard;
