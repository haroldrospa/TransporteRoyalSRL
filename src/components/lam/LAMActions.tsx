
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Download, Upload, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import ImportExcelDialog from '@/components/lam/ImportExcelDialog';
import * as XLSX from 'xlsx';
import { useIsMobile } from '@/hooks/use-mobile';
import { isConduceDelayed } from '@/utils/time/conduceDelay';
import { calculateTransitTime } from '@/utils/time/transitTime';
import { useAuth } from '@/contexts/AuthContext';
import { getManualConduceEnabled, getExcelUploadEnabled } from '@/utils/userSettings';

interface LAMActionsProps {
  onRefresh: () => Promise<void>;
  loading: boolean;
  userLevel?: number;
  conduces?: any[];
  stats?: {
    bultosEnTransito: number;
    bultosTotalCount: number;
    clientesEnTransito: number;
    bultosEntregados: number;
    bultosDevueltos: number;
  };
  chartInfo?: {
    regularClientesCount: number;
    visitadoresClientesCount: number;
    devueltosCount: number;
    atrasadosCount: number;
    excepcionesCount: number;
    totalEntregados: number;
  };
  laboratorio: string;
}

const LAMActions = ({ onRefresh, loading, userLevel, conduces = [], stats, chartInfo, laboratorio }: LAMActionsProps) => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { refreshData } = useData();
  const isMobile = useIsMobile();

  const [manualConduceEnabled, setManualConduceEnabled] = useState(() => 
    user ? getManualConduceEnabled(user.id) : true
  );
  
  const [excelUploadEnabled, setExcelUploadEnabled] = useState(() => 
    user ? getExcelUploadEnabled(user.id, user.laboratorio) : (laboratorio === 'LAM')
  );

  // Sync state if user changes or when settings are toggled in UserAvatar profile dialog
  useEffect(() => {
    if (!user) return;
    
    // Set initial values
    setManualConduceEnabled(getManualConduceEnabled(user.id));
    setExcelUploadEnabled(getExcelUploadEnabled(user.id, user.laboratorio));

    const handleSettingsChange = () => {
      setManualConduceEnabled(getManualConduceEnabled(user.id));
      setExcelUploadEnabled(getExcelUploadEnabled(user.id, user.laboratorio));
    };

    window.addEventListener('user-settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('user-settings-changed', handleSettingsChange);
    };
  }, [user]);
  
  const handleRefreshData = async () => {
    try {
      await onRefresh();
      toast({
        title: "Datos actualizados",
        description: "Los datos han sido actualizados correctamente",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive"
      });
    }
  };

  const exportToExcel = () => {
    try {
      if (!conduces || conduces.length === 0) {
        toast({
          title: "No hay datos para exportar",
          description: "No se encontraron conduces para exportar",
          variant: "destructive"
        });
        return;
      }

      const data = conduces.map(conduce => {
        // Determinar el estado real del conduce
        let estadoReal = conduce.estado;
        if (conduce.estado === 'Entregado' && !conduce.excepcion && isConduceDelayed(conduce)) {
          estadoReal = 'Atrasado';
        }

        // Calcular tiempo en tránsito si el conduce está en tránsito
        let tiempoTransito = '';
        if (conduce.estado === 'En tránsito' && conduce.fechaEntrega) {
          const transitInfo = calculateTransitTime(conduce.fechaEntrega);
          tiempoTransito = transitInfo.displayText;
        }

        return {
          'Factura': conduce.numeroFactura,
          'No. Bulto': conduce.numeroConduce,
          'Cliente': conduce.numeroCliente,
          'Bultos': conduce.cantidadBultos,
          'Razón Social': conduce.razonSocial || '',
          'Ciudad': conduce.ciudad || '',
          'Fecha Carga': conduce.fechaCarga,
          'Fecha Salida': conduce.fechaEntrega,
          'Tiempo de Entrega': conduce.tiempoEntrega || '',
          'Tiempo en Tránsito': tiempoTransito,
          'Estado': estadoReal,
          'Encomendado': conduce.encomendado || 'No asignado',
          'Laboratorio': conduce.laboratorio,
          'Región': conduce.region,
          'Prioridad': conduce.prioridad ? 'Sí' : 'No',
          'Excepción': conduce.excepcion ? 'Sí' : 'No',
          'Bulto Modificado': conduce.bultoModificado ? 'Sí' : 'No',
          'Nota': conduce.nota || '',
          'Motivo Excepción': conduce.motivoExcepcion || '',
          'Nota Modificación Bulto': conduce.bultoModificacionNota || '',
          'Relación': conduce.relacion || '',
          'Cantidad Entregados': conduce.cantidadEntregados || '',
          'Hora Entrega Exacta': conduce.horaEntregaExacta || '',
        };
      });

      const workbook = XLSX.utils.book_new();
      
      // Hoja de conduces
      const conducesWorksheet = XLSX.utils.json_to_sheet(data);
      
      // Ajustar anchos de columna para conduces para que se vea limpio
      conducesWorksheet['!cols'] = [
        { wch: 15 }, // Factura
        { wch: 15 }, // No. Bulto
        { wch: 15 }, // Cliente
        { wch: 10 }, // Bultos
        { wch: 35 }, // Razón Social
        { wch: 20 }, // Ciudad
        { wch: 15 }, // Fecha Carga
        { wch: 15 }, // Fecha Salida
        { wch: 20 }, // Tiempo de Entrega
        { wch: 20 }, // Tiempo en Tránsito
        { wch: 15 }, // Estado
        { wch: 25 }, // Encomendado
        { wch: 15 }, // Laboratorio
        { wch: 10 }, // Región
        { wch: 10 }, // Prioridad
        { wch: 10 }, // Excepción
        { wch: 15 }, // Bulto Modificado
        { wch: 30 }, // Nota
        { wch: 30 }, // Motivo Excepción
        { wch: 30 }, // Nota Modificación Bulto
        { wch: 15 }, // Relación
        { wch: 15 }, // Cantidad Entregados
        { wch: 25 }  // Hora Entrega Exacta
      ];
      
      XLSX.utils.book_append_sheet(workbook, conducesWorksheet, 'Conduces LAM');
      
      // Hoja de estadísticas
      if (stats) {
        // Calcular rango de fechas de la carga de conduces
        let rangoFechas = 'Todos los registros';
        if (conduces.length > 0) {
          const dates = conduces
            .map(c => c.fechaCarga)
            .filter(Boolean)
            .map(d => {
              const parts = d.split(' ')[0].split('/');
              if (parts.length === 3) {
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              }
              const isoParsed = new Date(d);
              return isNaN(isoParsed.getTime()) ? null : isoParsed;
            })
            .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
          
          if (dates.length > 0) {
            const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
            const formatDateStr = (d: Date) => {
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              return `${day}/${month}/${year}`;
            };
            rangoFechas = `${formatDateStr(minDate)} al ${formatDateStr(maxDate)}`;
          }
        }

        const formattedDate = new Date().toLocaleString('es-DO', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

        const aoaData: any[][] = [
          [`REPORTE DE CONTROL DE BULTOS - ${laboratorio.toUpperCase()}`],
          [`Rango de Fechas: ${rangoFechas}`],
          [`Fecha de Generación: ${formattedDate}`],
          [],
          ['RESUMEN DE DISTRIBUCIÓN DE BULTOS', '', ''],
          ['Métrica / Estado', 'Bultos', 'Porcentaje del Total'],
          ['Bultos entregados', stats.bultosEntregados, stats.bultosTotalCount > 0 ? `${((stats.bultosEntregados / stats.bultosTotalCount) * 100).toFixed(2)}%` : '0.00%'],
          ['Bultos en tránsito', stats.bultosEnTransito, stats.bultosTotalCount > 0 ? `${((stats.bultosEnTransito / stats.bultosTotalCount) * 100).toFixed(2)}%` : '0.00%'],
          ['Bultos devueltos', stats.bultosDevueltos, stats.bultosTotalCount > 0 ? `${((stats.bultosDevueltos / stats.bultosTotalCount) * 100).toFixed(2)}%` : '0.00%'],
          ['Total bultos recibidos (Cargados)', stats.bultosTotalCount, '100.00%'],
          [],
        ];

        if (chartInfo) {
          const atrasadosBultosValor = (chartInfo as any).atrasadosBultos ?? 0;
          const excepcionesBultosValor = (chartInfo as any).excepcionesBultos ?? 0;
          const onTimeDeliveredBultos = Math.max(0, stats.bultosEntregados - atrasadosBultosValor);

          aoaData.push(
            ['DESGLOSE DE ENTREGAS', '', ''],
            ['Estado de Entrega', 'Bultos', 'Porcentaje del Total'],
            ['Bultos entregados a tiempo (Normal + Excepción)', onTimeDeliveredBultos, stats.bultosTotalCount > 0 ? `${((onTimeDeliveredBultos / stats.bultosTotalCount) * 100).toFixed(2)}%` : '0.00%'],
            ['Bultos atrasados (Entregados con retraso)', atrasadosBultosValor, stats.bultosTotalCount > 0 ? `${((atrasadosBultosValor / stats.bultosTotalCount) * 100).toFixed(2)}%` : '0.00%'],
            ['Bultos entregados con excepción (Detalle)', excepcionesBultosValor, stats.bultosTotalCount > 0 ? `${((excepcionesBultosValor / stats.bultosTotalCount) * 100).toFixed(2)}%` : '0.00%'],
            [],
            ['DETALLE DE CONDUCES Y CLIENTES', '', ''],
            ['Métrica de Gestión', 'Cantidad', ''],
            ['Conduces entregados (Clientes regulares)', chartInfo.regularClientesCount, ''],
            ['Conduces entregados (Visitadores)', chartInfo.visitadoresClientesCount, ''],
            ['Total conduces entregados', chartInfo.totalEntregados, ''],
            ['Total conduces devueltos', chartInfo.devueltosCount, ''],
            ['Clientes en tránsito', stats.clientesEnTransito, '']
          );
        }

        const statsWorksheet = XLSX.utils.aoa_to_sheet(aoaData);
        
        // Ajustar anchos de columna para estadísticas para que no se corten los textos
        statsWorksheet['!cols'] = [
          { wch: 45 }, // Métrica
          { wch: 20 }, // Cantidad / Valor
          { wch: 25 }  // Porcentaje
        ];

        XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Estadísticas LAM');
      }

      const date = new Date();
      const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      const fileName = `LAM_Conduces_${formattedDate}.xlsx`;

      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Exportación exitosa",
        description: `Datos exportados a ${fileName}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar los datos",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`${isMobile ? 'flex flex-wrap gap-2' : 'flex gap-2'}`}>
      <Button 
        variant="outline" 
        onClick={handleRefreshData}
        disabled={loading}
        className="flex items-center gap-1"
        size={isMobile ? "sm" : "default"}
      >
        {loading ? 
          <Loader2 className="h-4 w-4 animate-spin" /> : 
          <RefreshCw className="h-4 w-4" />
        }
        {isMobile ? "" : "Actualizar"}
      </Button>
      
      <Button
        variant="outline"
        onClick={exportToExcel}
        className="flex items-center gap-1"
        disabled={conduces.length === 0}
        size={isMobile ? "sm" : "default"}
      >
        <Download className="h-4 w-4" />
        {isMobile ? "" : "Exportar Excel"}
      </Button>
      
      {userLevel && userLevel >= 4 && excelUploadEnabled && (
        <ImportExcelDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onImportSuccess={refreshData}
        />
      )}

      {manualConduceEnabled && (
        <Link to={`/crear-conduces?lab=${encodeURIComponent(laboratorio)}`}>
          <Button 
            className="bg-royal-blue flex items-center gap-1.5 hover:bg-royal-blue/90 text-white"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="h-4 w-4" />
            <span>Cargar conduces</span>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default LAMActions;

