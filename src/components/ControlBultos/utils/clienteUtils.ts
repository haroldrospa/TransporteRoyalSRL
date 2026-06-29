
import { Conduce } from '@/types/conduces';

export const getClienteEncomendado = (clienteConduces: Conduce[]) => {
  const encomendados = clienteConduces
    .map(c => c.encomendado)
    .filter(Boolean);
  
  if (encomendados.length === 0) return null;
  
  // Get the most frequent encomendado
  const counts = encomendados.reduce((acc, encomendado) => {
    acc[encomendado!] = (acc[encomendado!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts).sort(([,a], [,b]) => b - a)[0][0];
};
