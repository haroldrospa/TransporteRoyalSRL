import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createEntregaLAM } from '@/services/entregasLamService';
import { Package, User, FileText, Camera } from 'lucide-react';
import SignatureCanvas from '@/components/SignatureCanvas';
import ImageUploader from '@/components/ImageUploader';
import { useData } from '@/contexts/DataContext';

interface EntregaLAMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EntregaLAMDialog = ({ open, onOpenChange, onSuccess }: EntregaLAMDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { clientes } = useData();
  
  const [cliente, setCliente] = useState('Laboratorio LAM');
  const [cantidadBultos, setCantidadBultos] = useState('');
  const [firmaDespachador, setFirmaDespachador] = useState('');
  const [imagenConduce, setImagenConduce] = useState('');
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get list of unique clients for the dropdown, filtering out empty values
  const clientesList = [
    'Laboratorio LAM', 
    ...Array.from(new Set(
      clientes
        .map(c => c.razonSocial)
        .filter(rs => rs && rs.trim() !== '')
    ))
  ];

  const handleClearSignature = () => {
    setFirmaDespachador('');
  };

  const handleSubmit = async () => {
    if (!cantidadBultos || !firmaDespachador || !imagenConduce) {
      toast({
        title: 'Error',
        description: 'Por favor complete todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createEntregaLAM({
        cliente,
        cantidad_bultos: parseInt(cantidadBultos),
        firma_despachador: firmaDespachador,
        imagen_conduce: imagenConduce,
        fecha_recogida: new Date().toISOString(),
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : undefined,
        notas: notas || undefined,
      });

      toast({
        title: 'Éxito',
        description: 'Entrega LAM registrada correctamente',
      });

      // Reset form
      setCliente('Laboratorio LAM');
      setCantidadBultos('');
      setFirmaDespachador('');
      setImagenConduce('');
      setNotas('');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating entrega LAM:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la entrega LAM',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6 text-primary" />
            Entrega de Bultos LAM
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="cliente" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Cliente
            </Label>
            <Select value={cliente} onValueChange={setCliente}>
              <SelectTrigger id="cliente">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clientesList.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad de Bultos */}
          <div className="space-y-2">
            <Label htmlFor="cantidad" className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Cantidad de Bultos a Recibir
            </Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              value={cantidadBultos}
              onChange={(e) => setCantidadBultos(e.target.value)}
              placeholder="Ingrese la cantidad"
            />
          </div>

          {/* Firma del Despachador */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Firma del Despachador
            </Label>
            <SignatureCanvas
              initialSignature={firmaDespachador}
              onSignatureCapture={setFirmaDespachador}
            />
          </div>

          {/* Foto del Conduce */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Foto del Conduce
            </Label>
            <ImageUploader onImageCapture={setImagenConduce} />
            {imagenConduce && (
              <div className="mt-2">
                <img src={imagenConduce} alt="Vista previa" className="max-w-full h-auto rounded-lg border" />
              </div>
            )}
          </div>

          {/* Notas (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="notas">
              Notas (Opcional)
            </Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {isSubmitting ? 'Guardando...' : 'Registrar Entrega'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
