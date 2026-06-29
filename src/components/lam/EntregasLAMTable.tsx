import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EntregaLAM } from '@/types/entregasLam';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Eye, Trash2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SignatureDisplay from '@/components/SignatureDisplay';
import { useToast } from '@/hooks/use-toast';
import { deleteEntregaLAM } from '@/services/entregasLamService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EntregasLAMTableProps {
  entregas: EntregaLAM[];
  onRefresh: () => void;
}

export const EntregasLAMTable = ({ entregas, onRefresh }: EntregasLAMTableProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaLAM | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entregaToDelete, setEntregaToDelete] = useState<EntregaLAM | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get unique months from entregas
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    entregas.forEach(entrega => {
      const date = new Date(entrega.fecha_recogida);
      const monthKey = format(date, 'yyyy-MM');
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [entregas]);

  // Filter entregas by search term and selected month
  const filteredEntregas = useMemo(() => {
    return entregas.filter(entrega => {
      const matchesSearch = 
        entrega.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entrega.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entrega.notas?.toLowerCase().includes(searchTerm.toLowerCase());

      if (selectedMonth === 'all') {
        return matchesSearch;
      }

      const entregaMonth = format(new Date(entrega.fecha_recogida), 'yyyy-MM');
      return matchesSearch && entregaMonth === selectedMonth;
    });
  }, [entregas, searchTerm, selectedMonth]);

  const handleViewDetails = (entrega: EntregaLAM) => {
    setSelectedEntrega(entrega);
    setShowDetailsDialog(true);
  };

  const handleDeleteClick = (entrega: EntregaLAM) => {
    setEntregaToDelete(entrega);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!entregaToDelete) return;

    setIsDeleting(true);
    try {
      await deleteEntregaLAM(entregaToDelete.id);
      toast({
        title: 'Éxito',
        description: 'Entrega LAM eliminada correctamente',
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting entrega LAM:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la entrega LAM',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setEntregaToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Entregas LAM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, usuario o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(month + '-01'), 'MMMM yyyy', { locale: es })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredEntregas.length} de {entregas.length} entregas
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Recogida</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cantidad Bultos</TableHead>
                  <TableHead>Imagen Conduce</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntregas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron entregas LAM
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntregas.map((entrega) => (
                    <TableRow key={entrega.id}>
                      <TableCell>
                        {format(new Date(entrega.fecha_recogida), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">{entrega.cliente}</TableCell>
                      <TableCell>{entrega.cantidad_bultos}</TableCell>
                      <TableCell>
                        <img
                          src={entrega.imagen_conduce}
                          alt="Conduce"
                          className="h-12 w-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleViewDetails(entrega)}
                        />
                      </TableCell>
                      <TableCell>{entrega.usuario_nombre || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entrega.notas || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(entrega)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(entrega)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Entrega LAM</DialogTitle>
          </DialogHeader>
          {selectedEntrega && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p className="text-base">{selectedEntrega.cliente}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cantidad de Bultos</p>
                  <p className="text-base">{selectedEntrega.cantidad_bultos}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Recogida</p>
                  <p className="text-base">
                    {format(new Date(selectedEntrega.fecha_recogida), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                  <p className="text-base">{selectedEntrega.usuario_nombre || 'N/A'}</p>
                </div>
              </div>

              {selectedEntrega.notas && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notas</p>
                  <p className="text-base p-3 bg-muted rounded-lg">{selectedEntrega.notas}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Firma del Despachador</p>
                <SignatureDisplay signatureData={selectedEntrega.firma_despachador} />
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Foto del Conduce</p>
                <img
                  src={selectedEntrega.imagen_conduce}
                  alt="Conduce"
                  className="w-full rounded-lg border"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrega LAM?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la entrega LAM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
