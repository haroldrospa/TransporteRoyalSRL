
import { useState, useEffect, useMemo } from 'react';
import { Package, CheckCircle2, Truck, AlertTriangle, XCircle, PackageX, Ban, User, Building2 } from 'lucide-react';
import { Conduce } from '@/types/conduces';
import { isVisitador } from '@/components/clientes/utils/clienteTypeUtils';

interface ScanResultDisplayProps {
  scanValue: string;
  scanType: 'conduce' | 'bulto';
  conduces: Conduce[];
  scannedBultoIds: Record<string, string[]>;
  selectedRelacion?: string;
  displayEncomendado?: string;
  displayNotFound?: boolean;
  displayDuplicate?: boolean;
  duplicateEncomendado?: string;
  displayDelivered?: boolean;
  displayUnassigned?: boolean;
}

// Status type for bulto scan results
type BultoStatus = 'success' | 'delivered' | 'unassigned' | 'duplicate' | 'notFound';

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  bgGradient: string;
  borderColor: string;
  titleColor: string;
  iconColor: string;
}

const getStatusConfig = (status: BultoStatus): StatusConfig => {
  const configs: Record<BultoStatus, StatusConfig> = {
    success: {
      icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
      title: 'Bulto Escaneado',
      bgGradient: 'bg-gradient-to-br from-green-50 via-green-50/30 to-green-50',
      borderColor: 'border-green-600',
      titleColor: 'text-green-700',
      iconColor: 'text-green-600'
    },
    delivered: {
      icon: <PackageX className="h-12 w-12 text-red-600" />,
      title: 'Conduce Entregado',
      bgGradient: 'bg-gradient-to-br from-red-50 via-red-50/30 to-red-50',
      borderColor: 'border-red-600',
      titleColor: 'text-red-700',
      iconColor: 'text-red-600'
    },
    unassigned: {
      icon: <Ban className="h-12 w-12 text-red-600" />,
      title: 'Sin Asignar',
      bgGradient: 'bg-gradient-to-br from-red-50 via-red-50/30 to-red-50',
      borderColor: 'border-red-600',
      titleColor: 'text-red-700',
      iconColor: 'text-red-600'
    },
    duplicate: {
      icon: <AlertTriangle className="h-12 w-12 text-red-600" />,
      title: 'Bulto Ya Escaneado',
      bgGradient: 'bg-gradient-to-br from-red-50 via-red-50/30 to-red-50',
      borderColor: 'border-red-600',
      titleColor: 'text-red-700',
      iconColor: 'text-red-600'
    },
    notFound: {
      icon: <XCircle className="h-12 w-12 text-red-600" />,
      title: 'No Existe',
      bgGradient: 'bg-gradient-to-br from-red-50 via-red-50/30 to-red-50',
      borderColor: 'border-red-600',
      titleColor: 'text-red-700',
      iconColor: 'text-red-600'
    }
  };
  return configs[status];
};

const ScanResultDisplay = ({
  scanValue,
  scanType,
  conduces,
  scannedBultoIds,
  selectedRelacion,
  displayEncomendado,
  displayNotFound,
  displayDuplicate,
  duplicateEncomendado,
  displayDelivered,
  displayUnassigned
}: ScanResultDisplayProps) => {
  const [message, setMessage] = useState<{text: string, type: 'success' | 'info' | 'warning' | 'error'} | null>(null);
  
  // Clear the message after 8 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Listen for custom events from scan handlers
  useEffect(() => {
    const handleStatusMessage = (event: CustomEvent) => {
      setMessage(event.detail);
    };
    
    window.addEventListener('scan-status-message', handleStatusMessage as EventListener);
    
    return () => {
      window.removeEventListener('scan-status-message', handleStatusMessage as EventListener);
    };
  }, []);
  
  // Find the conduce that matches the scanned value
  const conduceNumberForLookup =
    scanType === 'bulto' && scanValue ? scanValue.split('-')[0] : scanValue;

  const foundConduce = conduceNumberForLookup
    ? conduces.find(c => c.numeroConduce === conduceNumberForLookup)
    : null;

  // Determine if this is a Visitador or Cliente
  const numeroCliente = foundConduce?.numeroCliente || '';
  const isVisitadorType = isVisitador(numeroCliente);
  const clientTypeBadge = numeroCliente ? (
    <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-sm shadow-lg ${
      isVisitadorType ? 'bg-blue-500' : 'bg-amber-500'
    }`}>
      {isVisitadorType ? (
        <>
          <User className="h-4 w-4" />
          Visitador
        </>
      ) : (
        <>
          <Building2 className="h-4 w-4" />
          Cliente
        </>
      )}
    </div>
  ) : null;

  // Calculate scanned bultos if conduce found
  let scannedBultos = 0;
  let totalBultos = 0;

  const scannedBultoIdsAll = useMemo(() => {
    return Object.values(scannedBultoIds).flat();
  }, [scannedBultoIds]);

  // Treat "No asignado" from display props as a placeholder only (don't override real data)
  const displayEncomendadoSafe =
    displayEncomendado && displayEncomendado !== 'No asignado'
      ? displayEncomendado
      : undefined;

  // Prefer the encomendado coming from lastScannedInfo (displayEncomendado),
  // and fall back to the conduce data if present.
  let encomendadoName = displayEncomendadoSafe || 'No asignado';
  
  if (foundConduce) {
    encomendadoName = displayEncomendadoSafe || foundConduce.encomendado || 'No asignado';
    totalBultos = foundConduce.cantidadBultos;

    // Count by conduce number globally (do not depend on encomendado key)
    scannedBultos = scannedBultoIdsAll.filter(id => id.startsWith(`${foundConduce.numeroConduce}-`)).length;
  }

  // Determine the current status for bulto scans
  const getBultoStatus = (): BultoStatus => {
    if (displayNotFound) return 'notFound';
    if (displayDelivered) return 'delivered';
    if (displayUnassigned) return 'unassigned';
    if (displayDuplicate) return 'duplicate';
    return 'success';
  };

  // Check if complete
  const isComplete = totalBultos > 0 && scannedBultos >= totalBultos;
  
  return (
    <div className="border-t p-4">
      {/* For conduce scans, keep existing logic */}
      {scanType === 'conduce' && displayDuplicate && scanValue ? (
          <div className="space-y-4">
            <div className="relative border-2 border-red-600 rounded-lg p-4 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-red-50/30 to-red-50">
              {clientTypeBadge}
              <div className="mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
               <p className="text-xl font-bold mb-2 text-red-700">Conduce Ya Escaneado</p>
               <p className="text-2xl text-[#0A1D3F] font-bold mb-3">{scanValue}</p>
              {encomendadoName && (
                 <div className="mb-3">
                   <Truck className="h-10 w-10 mx-auto mb-1 text-[#0A1D3F]" />
                   <p className="text-3xl font-bold text-center text-[#0A1D3F]">{encomendadoName}</p>
                </div>
              )}
            </div>
          </div>
      ) : scanType === 'conduce' && displayNotFound && scanValue ? (
        <div className="relative flex flex-col items-center justify-center py-8 bg-red-500 rounded-lg border-2 border-red-600">
          {clientTypeBadge}
           <XCircle className="h-14 w-14 text-white mb-3" />
           <p className="text-2xl font-bold text-white mb-2">CONDUCE NO VÁLIDO</p>
           <p className="text-xl text-white font-bold mb-2">{scanValue}</p>
          <p className="text-lg text-white mt-4">{message?.text || 'Este conduce no se puede procesar'}</p>
        </div>
      ) : scanType === 'conduce' && scanValue && !displayNotFound && !displayDuplicate ? (
        <div className="space-y-4">
          <div className="relative border-2 border-green-600 rounded-lg p-4 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-green-50/30 to-green-50">
            {clientTypeBadge}
            <div className="mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
             <p className="text-xl font-bold text-green-700 mb-2">Conduce Escaneado</p>
             <p className="text-2xl text-[#0A1D3F] font-bold mb-3">{scanValue}</p>
             <div className="mb-3">
               <Truck className="h-10 w-10 mx-auto mb-1 text-[#0A1D3F]" />
               <p className="text-3xl font-bold text-center text-[#0A1D3F]">{encomendadoName}</p>
            </div>
            {selectedRelacion && (
              <div className="mt-4 p-3 bg-[#0A1D3F] text-white rounded-md">
                <span className="font-medium text-lg">Relación: {selectedRelacion}</span>
              </div>
            )}
          </div>
        </div>
      ) : scanType === 'bulto' && scanValue ? (
        /* Bulto scan results with unified design */
        (() => {
          const status = getBultoStatus();
          const config = getStatusConfig(status);
          const isError = status !== 'success';
          
          return (
            <div className="space-y-4">
              {/* Header with scan info */}
              {status === 'success' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-6 w-6 mr-2 text-[#0A1D3F]" />
                    <span className="text-xl font-semibold">{scannedBultos} de {totalBultos} bultos escaneados</span>
                  </div>
                  {isComplete && (
                    <span className="flex items-center text-green-600 font-semibold">
                      <CheckCircle2 className="h-5 w-5 mr-1" />
                      <span>Completo</span>
                    </span>
                  )}
                </div>
              )}
              
              {/* Status display box */}
              <div className={`relative border-2 ${config.borderColor} rounded-lg p-4 flex flex-col items-center justify-center ${config.bgGradient}`}>
                {/* Client Type Badge */}
                {clientTypeBadge}
                
                {/* Icon */}
                 <div className="mb-2">
                  {config.icon}
                </div>
                
                {/* Title */}
                <p className={`text-xl font-bold mb-2 ${config.titleColor}`}>
                  {config.title}
                </p>
                
                {/* Scanned value */}
                <p className="text-2xl text-[#0A1D3F] font-bold mb-3">
                  {scanValue}
                </p>
                
                {/* Encomendado (only show if has value) */}
                {encomendadoName && !displayUnassigned && (
                   <div className="mb-3">
                     <Truck className="h-10 w-10 mx-auto mb-1 text-[#0A1D3F]" />
                     <p className="text-3xl font-bold text-center text-[#0A1D3F]">
                       {encomendadoName}
                     </p>
                  </div>
                )}
                
                {/* Status-specific messages */}
                 {status === 'success' && scannedBultos < totalBultos && (
                   <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                     <p className="text-center text-blue-700 text-base font-semibold">
                       Faltan {totalBultos - scannedBultos} {totalBultos - scannedBultos === 1 ? 'bulto' : 'bultos'} por escanear
                     </p>
                  </div>
                )}
                
                 {status === 'success' && isComplete && (
                   <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-md">
                     <p className="text-center text-green-700 text-base font-semibold">
                       ✓ Todos los bultos escaneados
                     </p>
                  </div>
                )}
                
                 {status === 'delivered' && (
                   <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
                     <p className="text-center text-red-700 text-base font-semibold">
                       Este conduce ya fue entregado al cliente
                     </p>
                  </div>
                )}
                
                 {status === 'unassigned' && (
                   <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
                     <p className="text-center text-red-700 text-base font-semibold">
                       Este conduce no está asignado a ningún camión
                     </p>
                  </div>
                )}
                
                 {status === 'notFound' && (
                   <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
                     <p className="text-center text-red-700 text-base font-semibold">
                       No se encontró este conduce en el sistema
                     </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <Truck className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-center text-gray-500 text-lg">
            Escanee un {scanType === 'conduce' ? 'conduce' : 'bulto'} para ver la información
          </p>
          
          {scanType === 'conduce' && selectedRelacion && !message && (
            <div className="mt-4 p-3 bg-blue-100 text-blue-700 rounded-md">
              <span className="font-medium">Relación seleccionada: {selectedRelacion}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScanResultDisplay;
