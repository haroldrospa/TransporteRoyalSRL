
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';
import { DatabaseIcon, RefreshCw, Loader2 } from 'lucide-react';

const ImportMockData = () => {
  const {
    importMockData,
    loading,
    clientes,
    conduces
  } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const hasData = clientes.length > 0 || conduces.length > 0;

  const handleImportMockData = async () => {
    setIsImporting(true);
    try {
      console.log('Iniciando importación de datos de muestra...');
      await importMockData();
      
      toast({
        title: "Datos restaurados exitosamente",
        description: "Todos los datos de muestra han sido importados correctamente a la base de datos"
      });
      
      setIsDialogOpen(false);
      
      // Force a page reload to ensure all components reflect the new data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error importing mock data:', error);
      toast({
        title: "Error al restaurar datos",
        description: "No se pudieron importar los datos de muestra. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        className="bg-royal-blue hover:bg-royal-blue/90"
        disabled={loading || isImporting}
      >
        {loading || isImporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isImporting ? 'Restaurando...' : 'Cargando...'}
          </>
        ) : (
          <>
            <DatabaseIcon className="mr-2 h-4 w-4" />
            Restaurar Datos
          </>
        )}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasData ? "Restaurar todos los datos" : "Importar datos de muestra"}
            </DialogTitle>
            <DialogDescription>
              {hasData 
                ? "Esta acción eliminará todos los datos actuales y los reemplazará con datos de muestra completos. Esto incluye clientes y conduces. ¿Está seguro de que desea continuar?" 
                : "Esto importará datos de muestra completos (clientes y conduces) para que pueda probar la aplicación. ¿Desea continuar?"
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportMockData} disabled={isImporting} className="bg-royal-blue">
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <DatabaseIcon className="mr-2 h-4 w-4" />
                  {hasData ? "Sí, restaurar todos los datos" : "Importar datos"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportMockData;
