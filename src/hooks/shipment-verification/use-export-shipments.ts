
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';
import { VerifiedShipment } from './use-verified-shipments-data';
import { Conduce } from '@/types/conduces';

export function useExportShipments(verifiedShipments: VerifiedShipment[], conduces: Conduce[] = []) {
  const exportToExcel = () => {
    try {
      // Filter only bulto type shipments
      const bultoShipments = verifiedShipments.filter(item => item.scan_type === 'bulto');
      
      if (bultoShipments.length === 0) {
        toast({
          title: "Sin datos de bultos",
          description: "No hay bultos verificados para exportar",
          variant: "destructive"
        });
        return;
      }

      // Process verified bultos data
      const bultosData = bultoShipments.map(item => ({
        'Fecha de Verificación': new Date(item.verified_at).toLocaleDateString(),
        'Código de Conduce': item.conduce_number,
        'Número de Bulto': item.bulto_sequence,
        'Ciudad': item.ciudad || 'No disponible',
        'Camión': item.encomendado,
        'Estado': 'Verificado',
        'Usuario': item.user_name || 'No registrado',
        'Hora de Verificación': new Date(item.verified_at).toLocaleTimeString()
      }));

      // Get pending bultos (from conduces that haven't been fully verified)
      const verifiedConduceNumbers = new Set(verifiedShipments.map(v => v.conduce_number));
      const pendingConduces = conduces.filter(conduce => 
        !verifiedConduceNumbers.has(conduce.numeroConduce) && 
        conduce.estado === 'En tránsito'
      );

      // Create pending bultos data (expand each conduce by its bulto count)
      const pendingBultosData = [];
      pendingConduces.forEach(conduce => {
        const cantidadBultos = conduce.cantidadBultos || 1;
        for (let i = 1; i <= cantidadBultos; i++) {
          pendingBultosData.push({
            'Fecha de Verificación': 'Pendiente',
            'Código de Conduce': conduce.numeroConduce,
            'Número de Bulto': i,
            'Ciudad': conduce.ciudad || 'No disponible',
            'Camión': conduce.encomendado || 'No asignado',
            'Estado': 'Pendiente de verificar',
            'Usuario': 'N/A',
            'Hora de Verificación': 'N/A',
            'Fecha Carga': conduce.fechaCarga,
            'Cliente': conduce.numeroCliente,
            'Razón Social': conduce.razonSocial || 'No disponible'
          });
        }
      });

      // Combine and sort by date
      const allBultosData = [...bultosData, ...pendingBultosData];
      allBultosData.sort((a, b) => {
        if (a['Fecha de Verificación'] === 'Pendiente') return 1;
        if (b['Fecha de Verificación'] === 'Pendiente') return -1;
        return new Date(b['Fecha de Verificación']).getTime() - new Date(a['Fecha de Verificación']).getTime();
      });

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();

      // Sheet 1: All bultos
      const wsAll = XLSX.utils.json_to_sheet(allBultosData);
      XLSX.utils.book_append_sheet(wb, wsAll, 'Todos los Bultos');

      // Sheet 2: Only verified bultos
      if (bultosData.length > 0) {
        const wsVerified = XLSX.utils.json_to_sheet(bultosData);
        XLSX.utils.book_append_sheet(wb, wsVerified, 'Bultos Verificados');
      }

      // Sheet 3: Only pending bultos
      if (pendingBultosData.length > 0) {
        const wsPending = XLSX.utils.json_to_sheet(pendingBultosData);
        XLSX.utils.book_append_sheet(wb, wsPending, 'Bultos Pendientes');
      }

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `reporte_bultos_completo_${dateStr}.xlsx`;

      // Export to file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Exportación exitosa",
        description: `Reporte de bultos exportado como "${filename}"`,
      });
    } catch (error) {
      console.error('Error exporting bultos to Excel:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte de bultos",
        variant: "destructive"
      });
    }
  };

  return { exportToExcel };
}
