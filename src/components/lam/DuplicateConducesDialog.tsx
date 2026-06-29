import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Copy, Loader2 } from 'lucide-react';

interface DuplicateConducesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateConduces: Array<{
    numeroConduce: string;
    numeroFactura: string;
    numeroCliente: string;
    razonSocial?: string;
  }>;
  onForceDuplicate?: () => Promise<void>;
  isForcing?: boolean;
}

const DuplicateConducesDialog = ({ 
  isOpen, 
  onOpenChange, 
  duplicateConduces,
  onForceDuplicate,
  isForcing = false
}: DuplicateConducesDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Conduces Duplicados Detectados
          </DialogTitle>
          <DialogDescription>
            Los siguientes {duplicateConduces.length} conduces del archivo Excel ya existen en la base de datos:
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número Conduce</TableHead>
                <TableHead>Número Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Razón Social</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicateConduces.map((conduce, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <Badge variant="destructive">{conduce.numeroConduce}</Badge>
                  </TableCell>
                  <TableCell>{conduce.numeroFactura}</TableCell>
                  <TableCell>{conduce.numeroCliente}</TableCell>
                  <TableCell className="max-w-64 truncate" title={conduce.razonSocial}>
                    {conduce.razonSocial || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            Puedes duplicar estos conduces o cerrar para cancelar.
          </div>
          <div className="flex gap-2">
            {onForceDuplicate && (
              <Button 
                onClick={onForceDuplicate}
                variant="destructive"
                disabled={isForcing}
              >
                {isForcing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Duplicando...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </>
                )}
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)} variant="outline" disabled={isForcing}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateConducesDialog;