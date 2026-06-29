
import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';

export const useStatusBadgeRenderer = () => {
  const renderStatusBadge = useCallback((estado: string) => {
    switch (estado) {
      case 'Entregado':
        return (
          <Badge className="bg-emerald-50 hover:bg-emerald-100/50 text-emerald-700 border border-emerald-200/80 font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            Entregado
          </Badge>
        );
      case 'En tránsito':
        return (
          <Badge className="bg-amber-50 hover:bg-amber-100/50 text-amber-700 border border-amber-200/80 font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            En tránsito
          </Badge>
        );
      case 'Devuelto':
        return (
          <Badge className="bg-rose-50 hover:bg-rose-100/50 text-rose-700 border border-rose-200/80 font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            Devuelto
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-50 text-slate-700 border border-slate-200 font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            {estado}
          </Badge>
        );
    }
  }, []);

  return { renderStatusBadge };
};
