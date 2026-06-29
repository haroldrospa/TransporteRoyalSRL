import { AlertTriangle, Package, FileText, Truck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { usePendingScannedConduces } from '@/hooks/usePendingScannedConduces';
import { Conduce } from '@/types/conduces';

interface PendingScansAlertProps {
  userConduces: Conduce[];
}

export const PendingScansAlert = ({ userConduces }: PendingScansAlertProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { pendingScannedConduces, loading, hasPendingScans } = usePendingScannedConduces(userConduces);

  if (loading || !hasPendingScans) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mb-4">
      <Alert className="border-amber-200 bg-amber-50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 font-medium">
              Tienes {pendingScannedConduces.length} conduces pendientes de escanear en el proceso de carga
            </AlertDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
              {isOpen ? 'Ocultar' : 'Ver detalles'}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                <Package className="h-4 w-4" />
                Conduces pendientes de escanear
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingScannedConduces.map(({ conduce, missingScans }) => (
                <div 
                  key={conduce.id} 
                  className="bg-white border border-amber-200 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="font-mono text-sm font-semibold">
                        {conduce.numeroConduce}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {missingScans.conduceNotScanned && (
                        <Badge variant="destructive" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Conduce no escaneado
                        </Badge>
                      )}
                      {!missingScans.conduceNotScanned && missingScans.missingBultos > 0 && (
                        <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                          <Package className="h-3 w-3 mr-1" />
                          {missingScans.scannedBultos}/{missingScans.totalBultos} bultos
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-1">
                    {conduce.razonSocial}
                  </div>
                  
                  {conduce.ciudad && (
                    <div className="text-xs text-gray-500 mb-2">
                      {conduce.ciudad}
                    </div>
                  )}
                  
                  <div className="text-xs text-amber-700 font-medium">
                    {missingScans.conduceNotScanned ? (
                      '• Necesita escanear el conduce en el proceso de carga'
                    ) : missingScans.missingBultos > 0 ? (
                      `• Faltan ${missingScans.missingBultos} bultos por escanear`
                    ) : null}
                  </div>
                </div>
              ))}
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Estos conduces necesitan ser escaneados en el proceso de "Cargar Camiones" 
                  antes de poder ser entregados correctamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Alert>
    </Collapsible>
  );
};