import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getDiasFestivos, agregarDiaFestivo as agregarDiaFestivoService, eliminarDiaFestivo as eliminarDiaFestivoService } from '@/services/diasFestivos';
import { updateDiasFestivosCache } from '@/utils/time/transitTime';
import { useToast } from '@/hooks/use-toast';

interface DiaFestivo {
  id: string;
  fecha: string; // YYYY-MM-DD format
  nombre: string;
}

const DiasFestivos = ({ onHolidaysChanged }: { onHolidaysChanged?: () => void }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('diasFestivos_isOpen');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [diasFestivos, setDiasFestivos] = useState<DiaFestivo[]>([]);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar días festivos desde la base de datos
  const cargarDiasFestivos = async () => {
    try {
      setLoading(true);
      const data = await getDiasFestivos();
      setDiasFestivos(data);
      
      // Actualizar el cache para los cálculos de tiempo de tránsito
      updateDiasFestivosCache(data);
      onHolidaysChanged?.();
    } catch (error) {
      console.error('Error loading días festivos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los días festivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDiasFestivos();
  }, []);

  // Guardar estado del collapsible en localStorage
  useEffect(() => {
    localStorage.setItem('diasFestivos_isOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  const agregarDiaFestivo = async () => {
    if (!nuevaFecha || !nuevoNombre.trim() || loading) return;

    try {
      setLoading(true);
      const success = await agregarDiaFestivoService(nuevaFecha, nuevoNombre.trim());
      
      if (success) {
        toast({
          title: "Día festivo agregado",
          description: `${nuevoNombre.trim()} ha sido agregado exitosamente`,
        });
        setNuevaFecha('');
        setNuevoNombre('');
        await cargarDiasFestivos(); // Recargar la lista y actualizar cache
      } else {
        toast({
          title: "Error",
          description: "No se pudo agregar el día festivo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding día festivo:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al agregar el día festivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarDiaFestivo = async (id: string) => {
    if (loading) return;

    try {
      setLoading(true);
      const success = await eliminarDiaFestivoService(id);
      
      if (success) {
        toast({
          title: "Día festivo eliminado",
          description: "El día festivo ha sido eliminado exitosamente",
        });
        await cargarDiasFestivos(); // Recargar la lista y actualizar cache
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el día festivo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting día festivo:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el día festivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    try {
      const date = parse(fecha, 'yyyy-MM-dd', new Date());
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Días Festivos</span>
                <Badge variant="secondary" className="text-xs">
                  {diasFestivos.length}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Formulario para agregar nuevo día festivo */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="fecha" className="text-xs font-medium">
                  Fecha
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-xs font-medium">
                  Nombre del festivo
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Día de la Independencia"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && agregarDiaFestivo()}
                  className="h-8 text-sm"
                />
              </div>
              
              <Button 
                onClick={agregarDiaFestivo}
                disabled={!nuevaFecha || !nuevoNombre.trim() || loading}
                size="sm"
                className="w-full h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {loading ? 'Guardando...' : 'Agregar'}
              </Button>
            </div>

            {/* Lista de días festivos */}
            <div className="space-y-2">
              {loading && diasFestivos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Cargando días festivos...
                </p>
              ) : diasFestivos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No hay días festivos configurados
                </p>
              ) : (
                diasFestivos.map((dia) => (
                  <div 
                    key={dia.id}
                    className="flex items-center justify-between p-2 bg-background border rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {dia.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatearFecha(dia.fecha)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarDiaFestivo(dia.id)}
                      disabled={loading}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {diasFestivos.length > 0 && (
              <div className="text-xs text-muted-foreground bg-info/10 p-2 rounded border-l-4 border-info">
                <p className="font-medium mb-1">ℹ️ Información:</p>
                <p>El tiempo en tránsito se pausará durante estos días festivos de 23:59 a 00:01 del día siguiente.</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DiasFestivos;