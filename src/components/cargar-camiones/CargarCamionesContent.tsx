
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useEncomendadoStats } from '@/hooks/useEncomendadoStats';
import { Conduce } from '@/types/conduces';
import { QrCode, ClipboardCheck } from 'lucide-react';
import CargarCamionesToolbar from './CargarCamionesToolbar';
import CargarCamionesScanningSection from './CargarCamionesScanningSection';
import CargarCamionesStatsGrid from './CargarCamionesStatsGrid';
import VerifiedShipmentsSection from './VerifiedShipmentsSection';
import MissingItemsDisplay from './MissingItemsDisplay';
import EncomendadoDetailsDialog from './EncomendadoDetailsDialog';
import PriorityConducesDisplay from './PriorityConducesDisplay';

interface CargarCamionesContentProps {
  conduces: Conduce[];
  scannedConduces: Record<string, string[]>;
  scannedBultos: Record<string, number>;
  scannedBultoIds: Record<string, string[]>;
  verifiedShipments: any[];
  currentScanValue: string;
  currentScanType: 'conduce' | 'bulto';
  displayScanValue?: string;
  displayScanType?: 'conduce' | 'bulto';
  displayEncomendado?: string;
  displayNotFound?: boolean;
  displayDuplicate?: boolean;
  displayDelivered?: boolean;
  displayUnassigned?: boolean;
  duplicateEncomendado?: string;
  setCurrentScanValue: (value: string) => void;
  setCurrentScanType: (type: 'conduce' | 'bulto') => void;
  onScanConduce: (encomendado: string, conduceNumber: string) => void;
  onScanBulto: (encomendado: string, bultoId: string, conduceNumber: string) => void;
  onNotFound: (scanValue: string, scanType: 'conduce' | 'bulto') => void;
  onUpdateScanValue: (value: string, type: 'conduce' | 'bulto') => void;
  onDeleteConduceShipment: (conduceNumber: string) => Promise<any>;
  onDeleteBultoShipment: (conduceNumber: string) => Promise<any>;
  onDeleteAllConduces: () => Promise<any>;
  onDeleteAllBultos: () => Promise<any>;
  onExportShipments: () => void;
  loadVerifiedShipments: () => Promise<void>;
  isProcessing: boolean;
  selectedRelacion: string;
  onRelacionChange: (relacion: string) => void;
  loading?: boolean;
}

const CargarCamionesContent = ({
  conduces,
  loading = false,
  scannedConduces,
  scannedBultos,
  scannedBultoIds,
  verifiedShipments,
  currentScanValue,
  currentScanType,
  displayScanValue,
  displayScanType,
  displayEncomendado,
  displayNotFound,
  displayDuplicate,
  displayDelivered,
  displayUnassigned,
  duplicateEncomendado,
  setCurrentScanValue,
  setCurrentScanType,
  onScanConduce,
  onScanBulto,
  onNotFound,
  onUpdateScanValue,
  onDeleteConduceShipment,
  onDeleteBultoShipment,
  onDeleteAllConduces,
  onDeleteAllBultos,
  onExportShipments,
  loadVerifiedShipments,
  isProcessing,
  selectedRelacion,
  onRelacionChange
}: CargarCamionesContentProps) => {
  const [selectedEncomendado, setSelectedEncomendado] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Use display values for persistent information, fallback to current values
  const scanValueToShow = displayScanValue || currentScanValue;
  const scanTypeToShow = displayScanType || currentScanType;
  
  // Debug logging
  console.log('CargarCamionesContent - Total conduces received:', conduces.length);
  console.log('CargarCamionesContent - Sample conduce:', conduces.length > 0 ? conduces[0] : 'No conduces');
  
  const assignedConduces = conduces.filter(c => c.encomendado && c.estado === 'En tránsito');
  console.log('CargarCamionesContent - Assigned conduces found:', assignedConduces.length);
  const encomendadoStats = useEncomendadoStats(
    assignedConduces,
    scannedConduces,
    scannedBultoIds
  );
  
  const handleEncomendadoClick = (encomendado: string) => {
    setSelectedEncomendado(encomendado);
    setShowDetailsDialog(true);
  };

  const verifiedConducesCount = verifiedShipments.filter(s => s.scan_type === 'conduce').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="escaneo" className="w-full space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-10">
            <TabsTrigger 
              value="escaneo" 
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-royal-blue data-[state=active]:shadow-sm transition-all"
            >
              <QrCode className="h-4 w-4" />
              <span>Estación de Escaneo</span>
            </TabsTrigger>
            <TabsTrigger 
              value="verificados" 
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-royal-blue data-[state=active]:shadow-sm transition-all"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>Conduces Verificados</span>
              {verifiedShipments.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-royal-blue dark:text-blue-300">
                  {verifiedConducesCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Estación de Escaneo y Carga */}
        <TabsContent value="escaneo" className="space-y-6 m-0 focus-visible:ring-0 focus-visible:outline-none">
          <Card className="shadow-md">
            <CardContent className="p-0">
              <CargarCamionesScanningSection
                conduces={conduces}
                scannedConduces={scannedConduces}
                scannedBultos={scannedBultos}
                scannedBultoIds={scannedBultoIds}
                onScanConduce={onScanConduce}
                onScanBulto={onScanBulto}
                onNotFound={onNotFound}
                onUpdateScanValue={onUpdateScanValue}
                scanValue={scanValueToShow}
                scanType={scanTypeToShow}
                displayEncomendado={displayEncomendado}
                displayNotFound={displayNotFound}
                displayDuplicate={displayDuplicate}
                displayDelivered={displayDelivered}
                displayUnassigned={displayUnassigned}
                duplicateEncomendado={duplicateEncomendado}
                setScanValue={setCurrentScanValue}
                setScanType={setCurrentScanType}
                isProcessing={isProcessing}
                selectedRelacion={selectedRelacion}
                onRelacionChange={onRelacionChange}
              />
            </CardContent>
          </Card>

          <MissingItemsDisplay 
            conduces={conduces}
            scannedConduces={scannedConduces}
            scannedBultos={scannedBultos}
            scannedBultoIds={scannedBultoIds}
            loading={loading}
          />

          <PriorityConducesDisplay encomendadoStats={encomendadoStats} />

          <Card className="shadow-md bg-white">
            <CardContent className="px-6 py-5">
              <CargarCamionesStatsGrid 
                encomendadoStats={encomendadoStats} 
                onEncomendadoClick={handleEncomendadoClick}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Conduces y Bultos Verificados */}
        <TabsContent value="verificados" className="space-y-6 m-0 focus-visible:ring-0 focus-visible:outline-none">
          <VerifiedShipmentsSection 
            shipments={verifiedShipments}
            refreshShipments={loadVerifiedShipments}
            onDeleteConduceShipment={onDeleteConduceShipment}
            onDeleteBultoShipment={onDeleteBultoShipment}
            onDeleteAllConduces={onDeleteAllConduces}
            onDeleteAllBultos={onDeleteAllBultos}
          />

          <div className="mt-4">
            <CargarCamionesToolbar
              onClear={async () => {
                await Promise.all([onDeleteAllConduces(), onDeleteAllBultos()]);
              }}
              onExport={onExportShipments}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <EncomendadoDetailsDialog 
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        encomendado={selectedEncomendado}
        verifiedShipments={verifiedShipments}
        assignedConduces={assignedConduces}
      />
    </div>
  );
};

export default CargarCamionesContent;
