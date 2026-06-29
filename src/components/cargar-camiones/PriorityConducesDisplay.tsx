
import { useState } from 'react';
import { AlertTriangle, FileText, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PriorityConducesDisplayProps {
  encomendadoStats: Record<string, { 
    conduces: number, 
    bultos: number, 
    scannedConduces: number, 
    scannedBultos: number,
    clientCount?: number,
    priorityConduces?: number,
    priorityDetails?: any[]
  }>;
}

const PriorityConducesDisplay = ({ encomendadoStats }: PriorityConducesDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Filtrar solo los camiones que tienen conduces en prioridad
  const trucksWithPriority = Object.entries(encomendadoStats).filter(
    ([_, stats]) => (stats.priorityConduces || 0) > 0
  );

  if (trucksWithPriority.length === 0) {
    return null;
  }

  const totalPriorityConduces = trucksWithPriority.reduce(
    (total, [_, stats]) => total + (stats.priorityConduces || 0), 
    0
  );

  return (
    <Card className="shadow-md bg-red-50 border-red-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Conduces en Prioridad
            <Badge variant="destructive" className="ml-2">
              {totalPriorityConduces} total
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-red-600 hover:text-red-800 hover:bg-red-100"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {trucksWithPriority.map(([encomendado, stats]) => (
            <div key={encomendado} className="bg-white p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{encomendado}</h3>
                <Badge variant="destructive" className="text-xs">
                  {stats.priorityConduces} en prioridad
                </Badge>
              </div>
              
              <div className="space-y-2">
                {stats.priorityDetails?.map((conduce) => (
                  <div key={conduce.id} className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-600" />
                        <span className="font-mono text-sm font-semibold text-red-800">
                          {conduce.numeroConduce}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <Users className="h-3 w-3" />
                        {conduce.numeroCliente}
                      </div>
                    </div>
                    
                    <div className="text-sm text-red-700">
                      <p className="font-medium">{conduce.razonSocial}</p>
                      {conduce.ciudad && (
                        <p className="text-xs text-red-600 mt-1">{conduce.ciudad}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 text-xs text-red-600">
                      <span>Bultos: {conduce.cantidadBultos}</span>
                      <span>Factura: {conduce.numeroFactura}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default PriorityConducesDisplay;
