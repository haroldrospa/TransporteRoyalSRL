import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { CheckCircle2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScanSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conduceNumber: string;
  fechaCarga: string;
  relacionNombre: string;
}

const ScanSuccessDialog = ({
  open,
  onOpenChange,
  conduceNumber,
  fechaCarga,
  relacionNombre
}: ScanSuccessDialogProps) => {
  // Helper para formatear fecha de dd/mm/yyyy a formato legible
  const formatFecha = (fechaStr: string): string => {
    try {
      const [day, month, year] = fechaStr.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-DO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 border-2 border-green-500">
        <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-b from-green-50 to-white space-y-6">
          {/* Icono de éxito */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle2 className="h-24 w-24 text-green-600 relative animate-in zoom-in duration-300" />
          </div>

          {/* Número de conduce */}
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-sm px-4 py-1">
              <Package className="h-3 w-3 mr-2" />
              Conduce #{conduceNumber}
            </Badge>
            <h3 className="text-2xl font-bold text-green-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
              Recibido en Nave
            </h3>
          </div>

          {/* Fecha de carga - GRANDE */}
          <div className="text-center space-y-2 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
              Fecha de Carga
            </p>
            <p className="text-5xl font-bold text-primary">
              {formatFecha(fechaCarga)}
            </p>
          </div>

          {/* Relación - Mediano */}
          <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
              Relación
            </p>
            <Badge className="text-3xl px-6 py-3 bg-primary hover:bg-primary">
              Relación {relacionNombre}
            </Badge>
          </div>

          {/* Mensaje de cierre automático */}
          <p className="text-xs text-muted-foreground pt-4 animate-in fade-in duration-1000">
            Este mensaje se cerrará automáticamente...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanSuccessDialog;
