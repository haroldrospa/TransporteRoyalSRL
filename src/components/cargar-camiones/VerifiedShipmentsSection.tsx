import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ConducesVerificadosTable from './verified-shipments/ConducesVerificadosTable';
import BultosVerificadosTable from './verified-shipments/BultosVerificadosTable';
import { toast } from '@/hooks/use-toast';
import { ClipboardList, Package, ChevronDown, CheckCircle2, Boxes } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [isConducesOpen, setIsConducesOpen] = useState(true);
  const [isBultosOpen, setIsBultosOpen] = useState(true);

  const stats = useMemo(() => {
    const conduceShipments = shipments.filter(s => s.scan_type === 'conduce');
    const bultoShipments = shipments.filter(s => s.scan_type === 'bulto');
    const uniqueConducesCount = new Set(conduceShipments.map(s => s.conduce_number)).size;
    const uniqueBultosConducesCount = new Set(bultoShipments.map(s => s.conduce_number)).size;

    return {
      totalConducesScans: conduceShipments.length,
      uniqueConduces: uniqueConducesCount,
      totalBultosScans: bultoShipments.length,
      uniqueBultosConduces: uniqueBultosConducesCount
    };
  }, [shipments]);
  
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Conduces Verificados Card */}
      <Card className="border border-border/70 shadow-none bg-card rounded-xl overflow-hidden">
        <Collapsible open={isConducesOpen} onOpenChange={setIsConducesOpen}>
          <CardHeader className="p-3.5 bg-muted/20 border-b border-border/50">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent group">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="h-4 w-4 text-royal-blue" />
                  <CardTitle className="text-sm font-semibold text-foreground">Conduces Verificados</CardTitle>
                  <span className="inline-flex items-center justify-center min-w-[22px] px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {stats.uniqueConduces}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isConducesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="p-3.5">
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

      {/* Bultos Verificados Card */}
      <Card className="border border-border/70 shadow-none bg-card rounded-xl overflow-hidden">
        <Collapsible open={isBultosOpen} onOpenChange={setIsBultosOpen}>
          <CardHeader className="p-3.5 bg-muted/20 border-b border-border/50">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent group">
                <div className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-semibold text-foreground">Bultos Verificados</CardTitle>
                  <span className="inline-flex items-center justify-center min-w-[22px] px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {stats.totalBultosScans}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isBultosOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="p-3.5">
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
