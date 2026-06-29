
import { useEffect, useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchEmptyClientes } from '@/utils/excel/databaseOperations';
import { Cliente } from '@/types/cliente';
import { Link } from 'react-router-dom';

interface EmptyClientesBannerProps {
  onRefresh: () => Promise<void>;
}

const EmptyClientesBanner = ({ onRefresh }: EmptyClientesBannerProps) => {
  const [emptyClientes, setEmptyClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkEmptyClientes();
  }, []);

  const checkEmptyClientes = async () => {
    setLoading(true);
    try {
      const clientes = await fetchEmptyClientes();
      console.log('Empty clientes fetched:', clientes);
      setEmptyClientes(clientes);
    } catch (error) {
      console.error('Error checking for empty clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await onRefresh();
    checkEmptyClientes();
  };

  const getMissingFields = (cliente: Cliente) => {
    const missing = [];
    if (!cliente.razonSocial) missing.push('Razón Social');
    if (!cliente.ciudad) missing.push('Ciudad');
    return missing;
  };

  if (emptyClientes.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800">
        Atención: {emptyClientes.length} cliente(s) con datos incompletos
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-amber-700 mb-2">
          Los siguientes clientes requieren completar su información:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {emptyClientes.map((cliente) => (
            <TooltipProvider key={cliente.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="bg-amber-100 border-amber-300 text-amber-800 flex items-center gap-1"
                  >
                    <span>{cliente.numeroCliente}</span>
                    <Info className="h-3 w-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Faltan: {getMissingFields(cliente).join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            <Link to="/clientes">
              Ir a Clientes
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-amber-700 border-amber-300 hover:bg-amber-100" 
            onClick={handleRefresh} 
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar lista'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default EmptyClientesBanner;
