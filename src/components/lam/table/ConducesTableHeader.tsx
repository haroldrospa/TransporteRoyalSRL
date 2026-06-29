
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Package, FileText, User, Building2, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface ConducesTableHeaderProps {
  isLamUser: boolean;
}

const ConducesTableHeader = ({ isLamUser }: ConducesTableHeaderProps) => {
  return (
    <TableHeader className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 z-10">
      <TableRow className="border-0 hover:bg-transparent">
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-20">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Factura
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-20">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            No. bulto
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-16">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Cliente
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-16">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            Bultos
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-32">
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Razón Social
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-20">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Ciudad
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-20">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Fecha Carga
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-20">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Fecha Salida
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-24">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Tiempo de Entrega
          </div>
        </TableHead>
        <TableHead className="text-white font-semibold text-xs py-3 px-2 border-r border-slate-700 bg-royal-blue w-24">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Estado
          </div>
        </TableHead>
        {!isLamUser && (
          <TableHead className="text-white font-semibold text-xs py-3 px-2 bg-royal-blue w-24">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Encomendado
            </div>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
};

export default ConducesTableHeader;
