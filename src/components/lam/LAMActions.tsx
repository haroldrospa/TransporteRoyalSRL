
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
      XLSX.utils.book_append_sheet(workbook, conducesWorksheet, 'Conduces LAM');
      
      // Hoja de estadísticas
      if (stats) {
        const bultosTransitoPercent = stats.bultosTotalCount > 0 
          ? Math.round((stats.bultosEnTransito / stats.bultosTotalCount) * 100) 
          : 0;
        const bultosEntregadosPercent = stats.bultosTotalCount > 0 
          ? Math.round((stats.bultosEntregados / stats.bultosTotalCount) * 100) 
          : 0;
        const bultosDevueltosPercent = stats.bultosTotalCount > 0 
          ? Math.round((stats.bultosDevueltos / stats.bultosTotalCount) * 100) 
          : 0;
          
        const statsData = [
          { 'Métrica': 'Bultos en tránsito', 'Valor': stats.bultosEnTransito, 'Total': stats.bultosTotalCount, 'Porcentaje': `${bultosTransitoPercent}%` },
          { 'Métrica': 'Bultos entregados', 'Valor': stats.bultosEntregados, 'Total': stats.bultosTotalCount, 'Porcentaje': `${bultosEntregadosPercent}%` },
          { 'Métrica': 'Bultos devueltos', 'Valor': stats.bultosDevueltos, 'Total': stats.bultosTotalCount, 'Porcentaje': `${bultosDevueltosPercent}%` },
          { 'Métrica': 'Clientes en tránsito', 'Valor': stats.clientesEnTransito, 'Total': '', 'Porcentaje': '' },
          { 'Métrica': 'Total de bultos', 'Valor': stats.bultosTotalCount, 'Total': '', 'Porcentaje': '' }
        ];

        // Agregar datos de actividad si están disponibles
        if (chartInfo) {
          const atrasadosBultosValor = (chartInfo as any).atrasadosBultos ?? 0;
          const excepcionesBultosValor = (chartInfo as any).excepcionesBultos ?? 0;
          const atrasadosPercent = stats.bultosTotalCount > 0 
            ? Math.round((atrasadosBultosValor / stats.bultosTotalCount) * 100) 
            : 0;
          const excepcionesPercent = stats.bultosTotalCount > 0 
            ? Math.round((excepcionesBultosValor / stats.bultosTotalCount) * 100) 
            : 0;

          statsData.push(
            { 'Métrica': 'Bultos atrasados', 'Valor': atrasadosBultosValor, 'Total': stats.bultosTotalCount, 'Porcentaje': `${atrasadosPercent}%` },
            { 'Métrica': 'Bultos con excepción', 'Valor': excepcionesBultosValor, 'Total': stats.bultosTotalCount, 'Porcentaje': `${excepcionesPercent}%` },
            { 'Métrica': 'Conduces entregados (clientes regulares)', 'Valor': chartInfo.regularClientesCount, 'Total': chartInfo.totalEntregados, 'Porcentaje': '' },
            { 'Métrica': 'Conduces entregados (visitadores)', 'Valor': chartInfo.visitadoresClientesCount, 'Total': chartInfo.totalEntregados, 'Porcentaje': '' },
            { 'Métrica': 'Total conduces entregados', 'Valor': chartInfo.totalEntregados, 'Total': '', 'Porcentaje': '' },
            { 'Métrica': 'Total conduces devueltos', 'Valor': chartInfo.devueltosCount, 'Total': '', 'Porcentaje': '' }
          );
        }
        
        const statsWorksheet = XLSX.utils.json_to_sheet(statsData);
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
            <span>Crear Conduces</span>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default LAMActions;

