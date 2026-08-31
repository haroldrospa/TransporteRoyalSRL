
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Truck, Package, MapPin, Trash2, Loader2, Shield, User, Clock, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { canDeleteRecords } from '@/utils/userPermissions';

interface ShipmentRowProps {
  shipment: {
    conduce_number: string;
    encomendado: string;
    ciudad?: string;
    verified_at: string;
    packageCount: number;
    totalPackages: number;
    user_name?: string;
    isVerified: boolean;
  };
  isSelected: boolean;
  onSelect: (conduceNumber: string, checked: boolean) => void;
  onDelete: (conduceNumber: string) => void;
  isDeleting: string | null;
}

// Formatear ciudad a Title Case para mejor legibilidad
const formatCityName = (city?: string) => {
  if (!city) return "No disponible";
  return city
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ShipmentTableRow = ({ shipment, isSelected, onSelect, onDelete, isDeleting }: ShipmentRowProps) => {
  const { user } = useAuth();
  const userCanDelete = canDeleteRecords(user);
  
  const handleDeleteClick = () => {
    if (window.confirm(`¿Está seguro que desea eliminar el registro ${shipment.conduce_number}?`)) {
      onDelete(shipment.conduce_number);
    }
  };

  const isCurrentlyDeleting = isDeleting === shipment.conduce_number;
  const cityName = formatCityName(shipment.ciudad);
  const formattedTime = new Date(shipment.verified_at).toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <TableRow 
      key={shipment.conduce_number} 
      className={`
        group transition-colors duration-100 border-b border-border/30
        ${isSelected 
          ? 'bg-blue-50/50 dark:bg-blue-950/30' 
          : 'hover:bg-muted/20 bg-card'
        }
        ${isCurrentlyDeleting ? 'opacity-40 pointer-events-none' : ''}
      `}
    >
      {/* Checkbox */}
      <TableCell className="w-8 px-2 py-1.5 text-center align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(shipment.conduce_number, e.target.checked)}
          aria-label={`Seleccionar conduce ${shipment.conduce_number}`}
          className="h-3.5 w-3.5 rounded border-border/80 text-royal-blue focus:ring-royal-blue cursor-pointer"
        />
      </TableCell>

      {/* Conduce / ID */}
      <TableCell className="w-20 px-2 py-1.5 font-mono text-xs font-medium text-foreground">
        {shipment.conduce_number}
      </TableCell>

      {/* Ciudad */}
      <TableCell className="px-2 py-1.5 text-xs text-muted-foreground truncate" title={cityName}>
        {cityName}
      </TableCell>

      {/* Encomendado (Camión) */}
      <TableCell className="w-16 px-2 py-1.5 text-center text-xs font-medium text-foreground">
        {shipment.encomendado || "—"}
      </TableCell>

      {/* Paquetes / Bultos */}
      <TableCell className="w-14 px-2 py-1.5 text-center text-xs font-semibold text-foreground">
        {shipment.packageCount}
      </TableCell>

      {/* Usuario */}
      <TableCell className="w-20 px-2 py-1.5 text-xs text-muted-foreground truncate" title={shipment.user_name || "No registrado"}>
        {shipment.user_name?.split(' ')[0] || "—"}
      </TableCell>

      {/* Hora */}
      <TableCell className="w-14 px-2 py-1.5 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formattedTime}
      </TableCell>

      {/* Acción */}
      <TableCell className="w-8 px-1 py-1.5 text-right">
        {userCanDelete ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isCurrentlyDeleting}
            className="h-6 w-6 p-0 text-muted-foreground/30 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Eliminar"
          >
            {isCurrentlyDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            <span className="sr-only">Eliminar</span>
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
};

export default ShipmentTableRow;
