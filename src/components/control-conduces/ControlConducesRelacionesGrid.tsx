import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Package, TrendingUp, AlertCircle, Send, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PendingConducesDialog from './PendingConducesDialog';

interface RelacionData {
  id: string;
  fecha: string;
  relacion: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  totalConduces: number;
  conducesRecibidosNave: number;
  conducesPendientesNave: number;
  conducesNoRecibidos: number;
  listaConduces: string[];
  conducesRecibidosLista: string[];
  conducesNoRecibidosLista: string[];
  conducesSinRelacion: string[];
  completado: boolean;
  enviadoLaboratorio?: boolean;
  fechaEnvioLaboratorio?: string;
}

interface ControlConducesRelacionesGridProps {
  relacionesPorFecha: Record<string, RelacionData[]>;
  loading: boolean;
  onUpdate: () => void;
}

const ControlConducesRelacionesGrid = ({
  relacionesPorFecha,
  loading,
  onUpdate
}: ControlConducesRelacionesGridProps) => {
  const [selectedRelacion, setSelectedRelacion] = useState<RelacionData | null>(null);
  const [sendingToLab, setSendingToLab] = useState<string | null>(null);

  const handleSendToLab = async (e: React.MouseEvent, relacion: RelacionData) => {
    e.stopPropagation();
    
    if (sendingToLab) return;
    
    setSendingToLab(relacion.id);
    
    try {
      const { error } = await supabase
        .from('relacion_conduces_fechas')
        .update({
          enviado_laboratorio: true,
          fecha_envio_laboratorio: new Date().toISOString()
        })
        .eq('id', relacion.id);

      if (error) throw error;

      toast.success(`Relación ${relacion.relacion.nombre} marcada como enviada a laboratorio`);
      onUpdate();
    } catch (error) {
      console.error('Error sending to lab:', error);
      toast.error('Error al marcar como enviada a laboratorio');
    } finally {
      setSendingToLab(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(j => (
                <Skeleton key={j} className="h-40" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const fechasOrdenadas = Object.keys(relacionesPorFecha).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (fechasOrdenadas.length === 0) {
    return (
      <div className="px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No hay relaciones registradas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-8">
      {fechasOrdenadas.map(fecha => (
        <div key={fecha} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-primary">
              {new Date(fecha + 'T00:00:00').toLocaleDateString('es-DO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
            <Badge variant="outline" className="ml-auto">
              {relacionesPorFecha[fecha].length} relaciones
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {relacionesPorFecha[fecha].map(relacion => {
              const totalFaltantes = relacion.conducesPendientesNave + relacion.conducesNoRecibidos;
              const conducesPendientes = relacion.listaConduces.filter(
                c => !relacion.conducesRecibidosLista.includes(c) && !relacion.conducesNoRecibidosLista.includes(c)
              );
              const isSending = sendingToLab === relacion.id;
              
              return (
                <Card
                  key={relacion.id}
                  className={`transition-all hover:shadow-lg cursor-pointer ${
                    relacion.enviadoLaboratorio
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                      : relacion.completado
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
                        : 'border-border'
                  }`}
                  onClick={() => setSelectedRelacion(relacion)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          Relación {relacion.relacion.nombre}
                        </CardTitle>
                        {relacion.relacion.descripcion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {relacion.relacion.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {relacion.enviadoLaboratorio && (
                          <Badge className="bg-blue-600 hover:bg-blue-700 text-xs">
                            Enviado
                          </Badge>
                        )}
                        {relacion.completado && !relacion.enviadoLaboratorio && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                        {totalFaltantes > 0 && !relacion.enviadoLaboratorio && (
                          <Badge variant="destructive" className="text-xs">
                            {totalFaltantes}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Total
                      </span>
                      <span className="text-lg font-bold">
                        {relacion.totalConduces}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Recibidos
                      </span>
                      <span className="text-lg font-semibold text-green-600">
                        {relacion.conducesRecibidosNave}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        Pendientes
                      </span>
                      <span className="text-lg font-semibold text-orange-500">
                        {relacion.conducesPendientesNave}
                      </span>
                    </div>

                    {relacion.conducesNoRecibidos > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          No Recibidos
                        </span>
                        <span className="text-lg font-semibold text-destructive">
                          {relacion.conducesNoRecibidos}
                        </span>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="pt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            relacion.enviadoLaboratorio ? 'bg-blue-600' :
                            relacion.completado ? 'bg-green-600' : 'bg-primary'
                          }`}
                          style={{
                            width: `${
                              relacion.totalConduces > 0
                                ? ((relacion.conducesRecibidosNave + relacion.conducesNoRecibidos) / relacion.totalConduces) * 100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        {relacion.totalConduces > 0
                          ? `${Math.round(
                              ((relacion.conducesRecibidosNave + relacion.conducesNoRecibidos) / relacion.totalConduces) * 100
                            )}%`
                          : '0%'}{' '}
                        completado
                      </p>
                    </div>

                    {/* Enviado a laboratorio badge or button */}
                    {relacion.enviadoLaboratorio ? (
                      <Badge className="w-full justify-center bg-blue-600 hover:bg-blue-700">
                        <Send className="h-3 w-3 mr-1" />
                        Enviado a Laboratorio
                      </Badge>
                    ) : relacion.completado ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => handleSendToLab(e, relacion)}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Marcar como Enviado a Lab
                      </Button>
                    ) : (
                      <Badge variant="outline" className="w-full justify-center">
                        Pendiente de completar
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {selectedRelacion && (
        <PendingConducesDialog
          open={!!selectedRelacion}
          onOpenChange={(open) => !open && setSelectedRelacion(null)}
          relacion={{
            id: selectedRelacion.relacion.id,
            nombre: selectedRelacion.relacion.nombre,
            descripcion: selectedRelacion.relacion.descripcion
          }}
          fecha={selectedRelacion.fecha}
          conducesPendientes={selectedRelacion.listaConduces.filter(
            c => !selectedRelacion.conducesRecibidosLista.includes(c) && !selectedRelacion.conducesNoRecibidosLista.includes(c)
          )}
          conducesNoRecibidos={selectedRelacion.conducesNoRecibidosLista}
          conducesSinRelacion={selectedRelacion.conducesSinRelacion || []}
          conducesRecibidos={selectedRelacion.conducesRecibidosLista}
          onUpdate={() => {
            onUpdate();
            setSelectedRelacion(null);
          }}
        />
      )}
    </div>
  );
};

export default ControlConducesRelacionesGrid;
