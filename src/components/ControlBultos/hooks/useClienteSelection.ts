
import { Conduce } from '@/types/conduces';

interface UseClienteSelectionProps {
  selectedConduces: string[];
  setSelectedConduces: (ids: string[]) => void;
}

export const useClienteSelection = ({ selectedConduces, setSelectedConduces }: UseClienteSelectionProps) => {
  const areAllClienteConducesSelected = (clienteConduces: string[]) => {
    return clienteConduces.length > 0 && clienteConduces.every(id => selectedConduces.includes(id));
  };

  const toggleClienteSelection = (clienteConduces: string[]) => {
    const allSelected = areAllClienteConducesSelected(clienteConduces);
    
    if (allSelected) {
      // Deselect all for this client
      setSelectedConduces(selectedConduces.filter(id => 
        !clienteConduces.includes(id)
      ));
    } else {
      // Select all for this client
      const newSelectedIds = [...selectedConduces];
      clienteConduces.forEach(id => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id);
        }
      });
      setSelectedConduces(newSelectedIds);
    }
  };

  return {
    areAllClienteConducesSelected,
    toggleClienteSelection
  };
};
