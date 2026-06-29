import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ConducesVerificadosTable from './verified-shipments/ConducesVerificadosTable';
import BultosVerificadosTable from './verified-shipments/BultosVerificadosTable';
import { toast } from '@/hooks/use-toast';
import { ClipboardList, Package, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface VerifiedShipmentsProps {
  shipments: any[];
  refreshShipments: () => Promise<void>;
  onDeleteConduceShipment: (conduceNumber: string) => Promise<any>;
  onDeleteBultoShipment: (conduceNumber: string) => Promise<any>;
  onDeleteAllConduces: () => Promise<any>;
  onDeleteAllBultos: () => Promise<any>;
  onExportComplete?: () => void;
}

const VerifiedShipmentsSection = ({ 
  shipments, 
  refreshShipments,
  onDeleteConduceShipment,
  onDeleteBultoShipment,
  onDeleteAllConduces,
  onDeleteAllBultos,
  onExportComplete
}: VerifiedShipmentsProps) => {
  const [isDeletingConduce, setIsDeletingConduce] = useState<string | null>(null);
  const [isDeletingBulto, setIsDeletingBulto] = useState<string | null>(null);
  const [isConducesOpen, setIsConducesOpen] = useState(false);
  const [isBultosOpen, setIsBultosOpen] = useState(false);
  
  const handleDeleteConduceShipment = async (conduceNumber: string) => {
    try {
      console.log("Deleting conduce shipment:", conduceNumber);
      setIsDeletingConduce(conduceNumber);
      
      const result = await onDeleteConduceShipment(conduceNumber);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Unknown error during deletion");
      }
      
      await refreshShipments();
      
      toast({
        title: "Conduce eliminado",
        description: `Se ha eliminado el escaneo del conduce ${conduceNumber}`,
      });
    } catch (error) {
      console.error('Error deleting conduce shipment:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro de conduce",
        variant: "destructive"
      });
    } finally {
      setIsDeletingConduce(null);
    }
  };

  const handleDeleteBultoShipment = async (conduceNumber: string) => {
    try {
      console.log("Deleting bulto shipment for conduce:", conduceNumber);
      setIsDeletingBulto(conduceNumber);
      
      const result = await onDeleteBultoShipment(conduceNumber);
      
      if (!result.success) {
        throw new Error(result.error?.message || "Unknown error during deletion");
      }
      
      await refreshShipments();
      
      toast({
        title: "Bultos eliminados",
        description: `Se han eliminado los escaneos de bultos del conduce ${conduceNumber}`,
      });
    } catch (error) {
      console.error('Error deleting bulto shipment:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar los registros de bultos",
        variant: "destructive"
      });
    } finally {
      setIsDeletingBulto(null);
    }
  };
  
  const handleDeleteAllConduces = async () => {
    if (!window.confirm("¿Está seguro que desea eliminar todos los conduces? Los bultos se mantendrán.")) {
      return;
    }
    
    try {
      const result = await onDeleteAllConduces();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Unknown error during bulk deletion");
      }
      
      await refreshShipments();
      
      toast({
        title: "Conduces eliminados",
        description: "Se han eliminado todos los escaneos de conduces",
      });
    } catch (error) {
      console.error('Error deleting all conduces:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los registros de conduces",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAllBultos = async () => {
    if (!window.confirm("¿Está seguro que desea eliminar todos los bultos? Los conduces se mantendrán.")) {
      return;
    }
    
    try {
      const result = await onDeleteAllBultos();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Unknown error during bulk deletion");
      }
      
      await refreshShipments();
      
      toast({
        title: "Bultos eliminados",
        description: "Se han eliminado todos los escaneos de bultos",
      });
    } catch (error) {
      console.error('Error deleting all bultos:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los registros de bultos",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <Collapsible open={isConducesOpen} onOpenChange={setIsConducesOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Conduces Verificados
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${isConducesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <ConducesVerificadosTable 
                shipments={shipments}
                onDeleteShipment={handleDeleteConduceShipment}
                onDeleteAllShipments={handleDeleteAllConduces}
                onExportComplete={onExportComplete}
                isDeleting={isDeletingConduce}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="shadow-lg">
        <Collapsible open={isBultosOpen} onOpenChange={setIsBultosOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Bultos Verificados
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${isBultosOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <BultosVerificadosTable 
                shipments={shipments}
                onDeleteShipment={handleDeleteBultoShipment}
                onDeleteAllShipments={handleDeleteAllBultos}
                onExportComplete={onExportComplete}
                isDeleting={isDeletingBulto}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default VerifiedShipmentsSection;
