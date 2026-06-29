import { CheckCircle2, XCircle, Package, Calendar, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScanResultInfoProps {
  conduceNumber: string;
  fechaCarga?: string;
  relacionNombre?: string;
  error?: boolean;
  errorMessage?: string;
}

const ScanResultInfo = ({
  conduceNumber,
  fechaCarga,
  relacionNombre,
  error = false,
  errorMessage
}: ScanResultInfoProps) => {
  // Helper para extraer el día de la fecha dd/mm/yyyy
  const getDia = (fechaStr: string): string => {
    try {
      const [day] = fechaStr.split('/');
      return day;
    } catch {
      return '';
    }
  };

  // Helper para formatear fecha sin el día (solo mes y año)
  const formatFechaSinDia = (fechaStr: string): string => {
    try {
      const [day, month, year] = fechaStr.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-DO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return fechaStr;
    }
  };

  if (error) {
    // Si el error es que ya fue recibido Y tenemos fecha/relación, mostrar todo
    const isAlreadyReceived = errorMessage?.includes('ya fue recibido');
    
    if (isAlreadyReceived && fechaCarga && relacionNombre) {
      return (
        <Card className="border-2 border-orange-500 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-background animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Icono de advertencia */}
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
                <XCircle className="h-16 w-16 text-orange-600 relative" />
              </div>

              {/* Título */}
              <h3 className="text-xl font-bold text-orange-700 dark:text-orange-400">
                Conduce Ya Recibido en Nave
              </h3>

              {/* Grid de información */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-2 max-w-4xl">
                {/* Número de conduce */}
                <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-semibold uppercase tracking-wide">
                      Conduce
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    #{conduceNumber}
                  </p>
                </div>

                {/* Fecha de carga y Relación */}
                <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-background/50">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        Fecha de Carga
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-6xl font-bold text-primary">
                        {getDia(fechaCarga)}
                      </p>
                      <p className="text-lg font-medium text-muted-foreground text-center capitalize">
                        {formatFechaSinDia(fechaCarga)}
                      </p>
                    </div>
                  </div>

                  {/* Relación debajo de la fecha */}
                  <div className="flex flex-col items-center space-y-2 pt-2 border-t border-border/50 w-full">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        Relación
                      </span>
                    </div>
                    <Badge className="text-xl px-4 py-2 bg-primary hover:bg-primary">
                      Relación {relacionNombre}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Error normal sin información adicional
    return (
      <Card className="border-2 border-destructive bg-gradient-to-b from-destructive/10 to-white dark:from-destructive/20 dark:to-background animate-in fade-in slide-in-from-top-4 duration-500">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Icono de error */}
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
              <XCircle className="h-16 w-16 text-destructive relative" />
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold text-destructive">
              Conduce No Encontrado
            </h3>

            {/* Información del error */}
            <div className="w-full max-w-2xl">
              <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-background/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Conduce
                  </span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  #{conduceNumber}
                </p>
                {errorMessage && (
                  <p className="text-center text-muted-foreground mt-2">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-green-500 bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background animate-in fade-in slide-in-from-top-4 duration-500">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Icono de éxito */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle2 className="h-16 w-16 text-green-600 relative" />
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
            Conduce Recibido en Nave
          </h3>

          {/* Grid de información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-2 max-w-4xl">
            {/* Número de conduce */}
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-background/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Conduce
                </span>
              </div>
              <p className="text-2xl font-bold text-primary">
                #{conduceNumber}
              </p>
            </div>

            {/* Fecha de carga y Relación */}
            <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-background/50">
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Fecha de Carga
                  </span>
                </div>
                {fechaCarga && (
                  <div className="flex flex-col items-center">
                    <p className="text-6xl font-bold text-primary">
                      {getDia(fechaCarga)}
                    </p>
                    <p className="text-lg font-medium text-muted-foreground text-center capitalize">
                      {formatFechaSinDia(fechaCarga)}
                    </p>
                  </div>
                )}
              </div>

              {/* Relación debajo de la fecha */}
              <div className="flex flex-col items-center space-y-2 pt-2 border-t border-border/50 w-full">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Relación
                  </span>
                </div>
                {relacionNombre && (
                  <Badge className="text-xl px-4 py-2 bg-primary hover:bg-primary">
                    Relación {relacionNombre}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanResultInfo;
