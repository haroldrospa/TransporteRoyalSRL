
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useEncomendadoStats } from '@/hooks/useEncomendadoStats';
import { Conduce } from '@/types/conduces';
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
}

const CargarCamionesContent = ({
  conduces,
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
  
  return (
    <div className="space-y-8 animate-fade-in">
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
      />

      <PriorityConducesDisplay encomendadoStats={encomendadoStats} />

      <Card className="shadow-md bg-white">
        <CardContent className="px-6 py-5">
          <CargarCamionesStatsGrid 
            encomendadoStats={encomendadoStats} 
            onEncomendadoClick={handleEncomendadoClick}
          />
        </CardContent>
      </Card>

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
