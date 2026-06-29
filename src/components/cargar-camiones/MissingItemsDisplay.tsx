import { Conduce } from '@/types/conduces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, AlertTriangle, Maximize, Minimize, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMemo, useState } from 'react';

interface MissingItemsDisplayProps {
  conduces: Conduce[];
  scannedConduces: Record<string, string[]>;
  scannedBultos: Record<string, number>;
  scannedBultoIds: Record<string, string[]>;
}

const MissingItemsDisplay = ({
  conduces,
  scannedConduces,
  scannedBultos,
  scannedBultoIds
}: MissingItemsDisplayProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // Global scanned sets (do NOT depend on encomendado key; assignments can change)
  const scannedConduceSet = useMemo(() => {
    return new Set(Object.values(scannedConduces).flat());
  }, [scannedConduces]);

  const scannedBultosByConduce = useMemo(() => {
    const map: Record<string, number> = {};
    const allIds = Object.values(scannedBultoIds).flat();

    allIds.forEach((id) => {
      const conduceNumber = id.split('-')[0];
      if (!conduceNumber) return;
      map[conduceNumber] = (map[conduceNumber] || 0) + 1;
    });

    return map;
  }, [scannedBultoIds]);

  // Filter assigned conduces (those with an encomendado and status "En tránsito")
  const assignedConduces = conduces.filter(c => c.encomendado && c.estado === 'En tránsito');

  // Group conduces by encomendado
  const groupedByEncomendado: Record<string, Conduce[]> = {};
  assignedConduces.forEach(conduce => {
    const { encomendado } = conduce;
    if (encomendado) {
      if (!groupedByEncomendado[encomendado]) {
        groupedByEncomendado[encomendado] = [];
      }
      groupedByEncomendado[encomendado].push(conduce);
    }
  });

  // Find missing conduces and missing bultos for each encomendado
  const missingItems: Record<string, {
    missingConduces: Conduce[];
    allPendingBultos: {
      conduce: Conduce;
      scanned: number;
      total: number;
    }[];
  }> = {};

  Object.entries(groupedByEncomendado).forEach(([encomendado, conduces]) => {
    const missingConduces = conduces.filter(c => !scannedConduceSet.has(c.numeroConduce));

    // Verificar TODOS los conduces para ver si tienen bultos pendientes
    const allConducesWithBultos = conduces.map(conduce => {
      const scannedBultosForConduce = scannedBultosByConduce[conduce.numeroConduce] || 0;

      return {
        conduce,
        scanned: scannedBultosForConduce,
        total: conduce.cantidadBultos
      };
    });
    
    const allPendingBultos = allConducesWithBultos.filter(item => item.scanned < item.total);
    
    if (missingConduces.length > 0 || allPendingBultos.length > 0) {
      missingItems[encomendado] = {
        missingConduces,
        allPendingBultos
      };
    }
  });
  
  const hasMissingItems = Object.keys(missingItems).length > 0;
  const hasMissingConduces = Object.values(missingItems).some(item => item.missingConduces.length > 0);
  const hasMissingBultos = Object.values(missingItems).some(item => item.allPendingBultos.length > 0);

  // Contar totales
  const totalMissingConduces = Object.values(missingItems).reduce((acc, item) => acc + item.missingConduces.length, 0);
  const totalMissingBultos = Object.values(missingItems).reduce((acc, item) => {
    return acc + item.allPendingBultos.reduce((sum, b) => sum + (b.total - b.scanned), 0);
  }, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className={`shadow-md ${!isOpen ? 'bg-gray-50' : 'bg-white'}`}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            <span>Items pendientes por escanear</span>
          </CardTitle>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isOpen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span className="sr-only">
                {isOpen ? 'Minimizar panel' : 'Maximizar panel'}
              </span>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {!hasMissingItems && (
              <div className="flex items-center justify-center gap-2 text-green-600 py-6">
                <Package className="h-6 w-6" />
                <span className="text-lg font-medium">Todos los conduces y bultos han sido escaneados</span>
              </div>
            )}
            
            {hasMissingItems && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna de Conduces Pendientes */}
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-200">
                    <FileText size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Conduces Pendientes</h3>
                    <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {totalMissingConduces}
                    </span>
                  </div>
                  
                  {!hasMissingConduces ? (
                    <p className="text-center text-gray-500 py-4">
                      ✓ Todos los conduces escaneados
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {Object.entries(missingItems).map(([encomendado, { missingConduces }]) => 
                        missingConduces.length > 0 && (
                          <div key={`conduces-${encomendado}`} className="bg-white rounded-md p-3 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 pb-1 border-b">
                              <Truck size={16} className="text-blue-600" />
                              <span className="font-medium text-sm">{encomendado}</span>
                              <span className="ml-auto text-xs text-gray-500">{missingConduces.length} conduces</span>
                            </div>
                            <div className="space-y-1.5">
                              {missingConduces.map(conduce => (
                                <div key={conduce.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded text-sm">
                                  <span className="font-mono font-medium text-blue-700">{conduce.numeroConduce}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600 truncate flex-1">{conduce.razonSocial || 'Sin nombre'}</span>
                                  {conduce.fechaCarga && (
                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">📅 {conduce.fechaCarga}</span>
                                  )}
                                  <span className="text-gray-500 text-xs">{conduce.cantidadBultos}B</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Columna de Bultos Pendientes */}
                <div className="border rounded-lg p-4 bg-amber-50/50">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200">
                    <Package size={20} className="text-amber-600" />
                    <h3 className="font-semibold text-amber-800">Bultos Pendientes</h3>
                    <span className="ml-auto bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {totalMissingBultos}
                    </span>
                  </div>
                  
                  {!hasMissingBultos ? (
                    <p className="text-center text-gray-500 py-4">
                      ✓ Todos los bultos escaneados
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {Object.entries(missingItems).map(([encomendado, { allPendingBultos }]) => 
                        allPendingBultos.length > 0 && (
                          <div key={`bultos-${encomendado}`} className="bg-white rounded-md p-3 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 pb-1 border-b">
                              <Truck size={16} className="text-amber-600" />
                              <span className="font-medium text-sm">{encomendado}</span>
                              <span className="ml-auto text-xs text-gray-500">
                                {allPendingBultos.reduce((sum, b) => sum + (b.total - b.scanned), 0)} pendientes
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {allPendingBultos.map(({ conduce, scanned, total }) => (
                                <div key={conduce.id} className="bg-gray-50 p-2 rounded text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-medium text-amber-700">{conduce.numeroConduce}</span>
                                    <span className="text-amber-600 font-medium">
                                      {scanned}/{total}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-gray-600 text-xs truncate">{conduce.razonSocial || 'Sin nombre'}</span>
                                    <span className="text-xs text-red-500 font-medium">
                                      Faltan {total - scanned}
                                    </span>
                                  </div>
                                  {conduce.fechaCarga && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">📅 Cargado: {conduce.fechaCarga}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
        
        {/* Resumen cuando está colapsado */}
        {!isOpen && hasMissingItems && (
          <div className="px-4 pb-3 flex gap-4">
            <span className="text-sm text-blue-600 font-medium">
              {totalMissingConduces} conduces pendientes
            </span>
            <span className="text-sm text-amber-600 font-medium">
              {totalMissingBultos} bultos pendientes
            </span>
          </div>
        )}
      </Card>
    </Collapsible>
  );
};

export default MissingItemsDisplay;
