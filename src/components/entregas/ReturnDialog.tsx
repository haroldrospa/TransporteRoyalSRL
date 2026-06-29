
import { useState } from 'react';
import { Conduce } from '@/types/conduces';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ReturnDialogProps {
  conduce: Conduce | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string) => Promise<void>;
  isSubmitting: boolean;
}

export const ReturnDialog = ({
  conduce,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: ReturnDialogProps) => {
  const [returnNote, setReturnNote] = useState('');

  const handleSubmit = () => {
    if (returnNote.length > 0) {
      onSubmit(returnNote);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Devolución</DialogTitle>
        </DialogHeader>
        
        {conduce && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Conduce</Label>
                <div className="font-medium">{conduce.numeroConduce}</div>
              </div>
              <div>
                <Label>Cliente</Label>
                <div className="font-medium">{conduce.numeroCliente}</div>
              </div>
            </div>
            
            <div>
              <Label>Razón Social</Label>
              <div className="font-medium">{conduce.razonSocial || '-'}</div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="return-reason">Motivo de devolución *</Label>
              <Textarea
                id="return-reason"
                placeholder="Indique el motivo de la devolución..."
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                required
              />
              {returnNote.length === 0 && (
                <p className="text-sm text-red-500">
                  Debe indicar un motivo para la devolución
                </p>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit}
            className="bg-orange-500"
            disabled={returnNote.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Confirmar Devolución
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
