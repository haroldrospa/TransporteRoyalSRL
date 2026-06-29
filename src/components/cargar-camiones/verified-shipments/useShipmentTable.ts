
import { useState, useMemo } from 'react';

interface VerifiedShipment {
  id: string;
  conduce_number: string;
  encomendado: string;
  scan_type: string;
  verified_at: string;
  bulto_sequence?: number;
  ciudad?: string;
  user_name?: string;
  conduces?: {
    cantidad_bultos?: number;
  };
}

export function useShipmentTable(shipments: VerifiedShipment[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [encomendadoFilter, setEncomendadoFilter] = useState('');

  // Get unique encomendados for filter dropdown
  const uniqueEncomendados = useMemo(() => {
    return Array.from(new Set(shipments.map(s => s.encomendado)));
  }, [shipments]);

  // Apply filters
  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      const matchesSearch = shipment.conduce_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEncomendado = !encomendadoFilter || shipment.encomendado === encomendadoFilter;
      return matchesSearch && matchesEncomendado;
    });
  }, [shipments, searchTerm, encomendadoFilter]);

  // Calculate packages counts
  const getPackageCount = (conduceNumber: string) => {
    return shipments.filter(s => 
      s.conduce_number === conduceNumber && s.scan_type === 'bulto'
    ).length;
  };

  // Group by conduce number and get the first entry per conduce
  const conducesToDisplay = useMemo(() => {
    const uniqueConduceNumbers = Array.from(new Set(filteredShipments.map(s => s.conduce_number)));
    
    return uniqueConduceNumbers.map(conduceNumber => {
      const conducesForNumber = filteredShipments.filter(s => s.conduce_number === conduceNumber);
      const firstConduce = conducesForNumber.find(c => c.scan_type === 'conduce') || conducesForNumber[0];
      
      // Count scanned bultos for this conduce
      const scannedBultoItems = conducesForNumber.filter(c => c.scan_type === 'bulto');
      const scannedBultosCount = scannedBultoItems.length;
      
      // Try to get total bultos needed from the conduce data
      const totalBultos = firstConduce.conduces?.cantidad_bultos || 0;
      
      // Get the user who scanned the bulto, or fallback to conduce scanner
      // Prioritize the bulto scanner over the conduce scanner
      const bultoUser = scannedBultoItems.length > 0 ? scannedBultoItems[0].user_name : null;
      const conduceUser = firstConduce.user_name;
      const userInfo = bultoUser || conduceUser || 'No registrado';
      
      // Check if this conduce is verified (has a conduce scan)
      const hasConduceScan = !!conducesForNumber.find(c => c.scan_type === 'conduce');
      const isVerified = hasConduceScan;
      
      return {
        ...firstConduce,
        packageCount: totalBultos || 0,
        totalPackages: totalBultos || 0,
        user_name: userInfo,
        isVerified
      };
    });
  }, [filteredShipments]);

  return {
    searchTerm,
    setSearchTerm,
    encomendadoFilter,
    setEncomendadoFilter,
    uniqueEncomendados,
    filteredShipments,
    conducesToDisplay
  };
}
