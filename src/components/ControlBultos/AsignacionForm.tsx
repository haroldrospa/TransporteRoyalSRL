
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Conduce } from '@/types/conduces';

interface AsignacionFormProps {
  encomendadosList: string[];
  selectedConduces: string[];
  conduces: Conduce[];
  asignarEncomendado: (conduceIds: string[], encomendado: string, prioridad?: boolean) => Promise<void>;
  onAssignComplete: () => void;
}

const AsignacionForm = ({
  encomendadosList,
  selectedConduces,
  conduces,
  asignarEncomendado,
  onAssignComplete
}: AsignacionFormProps) => {
  const [currentEncomendado, setCurrentEncomendado] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get stats for selected conduces
  const selectedStats = {
    bultos: selectedConduces.reduce((total, id) => {
      const conduce = conduces.find(c => c.id === id);
      return total + (conduce ? conduce.cantidadBultos : 0);
    }, 0),
    clientes: new Set(selectedConduces.map(id => {
      const conduce = conduces.find(c => c.id === id);
      return conduce ? conduce.numeroCliente : '';
    })).size
  };

  // Assign selected conduces to an encomendado
  const handleAssignEncomendado = async () => {
    if (!currentEncomendado) {
      toast({
        title: "Error",
        description: "Debe seleccionar un encomendado",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedConduces.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un conduce",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await asignarEncomendado(selectedConduces, currentEncomendado, isPriority);
      
      toast({
        title: "Operación exitosa",
        description: `${selectedConduces.length} conduces asignados a ${currentEncomendado}`,
        variant: "default"
      });
      
      onAssignComplete();
    } catch (error) {
      console.error('Error assigning encomendado:', error);
      toast({
        title: "Error",
        description: "No se pudieron asignar los conduces",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove assignment from conduces
  const handleRemoveAssignment = async () => {
    if (selectedConduces.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un conduce",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await asignarEncomendado(selectedConduces, '', false);
      
      toast({
        title: "Operación exitosa",
        description: `Asignación removida de ${selectedConduces.length} conduces`,
        variant: "default"
      });
      
      onAssignComplete();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "No se pudo remover la asignación",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Asignar Conduces</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Encomendado</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={currentEncomendado}
            onChange={(e) => setCurrentEncomendado(e.target.value)}
          >
            <option value="">Seleccionar encomendado</option>
            {encomendadosList.map(enc => (
              <option key={enc} value={enc}>{enc}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="priority" 
            checked={isPriority}
            onCheckedChange={(checked) => setIsPriority(checked as boolean)}
          />
          <label htmlFor="priority" className="text-sm font-medium">
            Marcar como prioridad
          </label>
        </div>
        
        <div className="flex flex-col space-y-2">
          <p className="text-sm font-medium">Conduces seleccionados: <span className="font-bold">{selectedConduces.length}</span></p>
          <p className="text-sm font-medium">Bultos seleccionados: <span className="font-bold">{selectedStats.bultos}</span></p>
          <p className="text-sm font-medium">Clientes seleccionados: <span className="font-bold">{selectedStats.clientes}</span></p>
        </div>
        
        <div className="space-y-2 pt-2">
          <Button 
            className="w-full bg-royal-blue" 
            onClick={handleAssignEncomendado}
            disabled={!currentEncomendado || selectedConduces.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Asignar Conduces
          </Button>
          
          <Button 
            className="w-full bg-red-600" 
            onClick={handleRemoveAssignment}
            disabled={selectedConduces.length === 0 || isSubmitting}
          >
            Eliminar Asignación
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AsignacionForm;
