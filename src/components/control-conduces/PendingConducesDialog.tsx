import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, Plus, Clock, Package, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface PendingConducesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relacion: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  fecha: string;
  conducesPendientes: string[];
  conducesNoRecibidos: string[];
  conducesSinRelacion: string[];
  conducesRecibidos?: string[];
  onUpdate: () => void;
}

const PendingConducesDialog = ({
  open,
  onOpenChange,
  relacion,
  fecha,
  conducesPendientes,
  conducesNoRecibidos,
  conducesSinRelacion,
  conducesRecibidos = [],
  onUpdate
}: PendingConducesDialogProps) => {
  const [marking, setMarking] = useState<string | null>(null);
  const [conduceInput, setConduceInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAddNoRecibido = async () => {
    if (!conduceInput.trim()) {
      toast({
        title: "Error",
        description: "Ingrese un número de conduce",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      // Verificar si ya está marcado como no recibido
      const { data: existing } = await supabase
        .from('verified_shipments')
        .select('id')
        .eq('conduce_number', conduceInput.trim())
        .eq('scan_type', 'conduce_no_recibido')
        .maybeSingle();

      if (existing) {
        toast({
          title: "Advertencia",
          description: "Este conduce ya está marcado como no recibido",
          variant: "destructive"
        });
        return;
      }

      // Marcar como no recibido
      const { error } = await supabase
        .from('verified_shipments')
        .insert({
          conduce_number: conduceInput.trim(),
          scan_type: 'conduce_no_recibido',
          encomendado: relacion.nombre,
          user_name: 'Manual'
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Conduce marcado como no recibido"
      });
      
      setConduceInput('');
      onUpdate();
    } catch (error) {
      console.error('Error marking conduce:', error);
      toast({
        title: "Error",
        description: "Error al marcar conduce",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveNoRecibido = async (conduceNumber: string) => {
    setMarking(conduceNumber);
    try {
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'conduce_no_recibido');

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Conduce removido de no recibidos"
      });
      onUpdate();
    } catch (error) {
      console.error('Error removing conduce:', error);
      toast({
        title: "Error",
        description: "Error al remover conduce",
        variant: "destructive"
      });
    } finally {
      setMarking(null);
    }
  };

  const handleDeleteRecibido = async (conduceNumber: string) => {
    setDeleting(conduceNumber);
    try {
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .eq('conduce_number', conduceNumber)
        .eq('scan_type', 'conduce_nave');

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Conduce ${conduceNumber} eliminado de recibidos`
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting conduce:', error);
      toast({
        title: "Error",
        description: "Error al eliminar conduce",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllRecibidos = async () => {
    if (conducesRecibidos.length === 0) return;
    
    setIsDeletingAll(true);
    try {
      const { error } = await supabase
        .from('verified_shipments')
        .delete()
        .in('conduce_number', conducesRecibidos)
        .eq('scan_type', 'conduce_nave');

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `${conducesRecibidos.length} conduces eliminados de recibidos`
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting all conduces:', error);
      toast({
        title: "Error",
        description: "Error al eliminar conduces",
        variant: "destructive"
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Conduces Faltantes - Relación {relacion.nombre}
          </DialogTitle>
          {relacion.descripcion && (
            <p className="text-sm text-muted-foreground">
              {relacion.descripcion}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Conduces Recibidos (Escaneados) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Conduces Recibidos (Escaneados)
                </h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700">{conducesRecibidos.length}</Badge>
              </div>
              {conducesRecibidos.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteAllRecibidos}
                  disabled={isDeletingAll}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isDeletingAll ? 'Eliminando...' : 'Eliminar Todos'}
                </Button>
              )}
            </div>
            {conducesRecibidos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay conduces escaneados aún</p>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {conducesRecibidos.map((conduce) => (
                  <div
                    key={conduce}
                    className="flex items-center justify-between p-3 border border-green-500/30 bg-green-50 rounded-lg"
                  >
                    <span className="font-mono font-medium text-green-700">{conduce}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRecibido(conduce)}
                      disabled={deleting === conduce || isDeletingAll}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conduces Pendientes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Conduces Pendientes por Escanear
              </h3>
              <Badge variant="secondary">{conducesPendientes.length}</Badge>
            </div>
            {conducesPendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos los conduces han sido escaneados</p>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {conducesPendientes.map((conduce) => (
                  <div
                    key={conduce}
                    className="flex items-center justify-between p-3 border border-orange-500/30 bg-orange-50 rounded-lg"
                  >
                    <span className="font-mono font-medium text-orange-700">{conduce}</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Pendiente
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conduces Sin Relación */}
          {conducesSinRelacion.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  Conduces Sin Relación Asignada
                </h3>
                <Badge variant="secondary">{conducesSinRelacion.length}</Badge>
              </div>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {conducesSinRelacion.map((conduce) => (
                  <div
                    key={conduce}
                    className="flex items-center justify-between p-3 border border-blue-500/30 bg-blue-50 rounded-lg"
                  >
                    <span className="font-mono font-medium text-blue-700">{conduce}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setConduceInput(conduce);
                      }}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Usar
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Estos conduces de esta fecha no tienen relación asignada
              </p>
            </div>
          )}

          {/* Agregar Conduce No Recibido */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Agregar Conduce No Recibido</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Número de conduce"
                value={conduceInput}
                onChange={(e) => setConduceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNoRecibido();
                  }
                }}
                className="font-mono"
              />
              <Button
                onClick={handleAddNoRecibido}
                disabled={isAdding || !conduceInput.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ingrese cualquier número de conduce que no fue recibido por el laboratorio
            </p>
          </div>

          {/* Conduces No Recibidos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Conduces No Recibidos
              </h3>
              <Badge variant="destructive">{conducesNoRecibidos.length}</Badge>
            </div>
            {conducesNoRecibidos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay conduces marcados como no recibidos</p>
            ) : (
              <div className="grid gap-2">
                {conducesNoRecibidos.map((conduce) => (
                  <div
                    key={conduce}
                    className="flex items-center justify-between p-3 border border-destructive/30 bg-destructive/5 rounded-lg"
                  >
                    <span className="font-mono font-medium text-destructive">{conduce}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveNoRecibido(conduce)}
                      disabled={marking === conduce}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingConducesDialog;
