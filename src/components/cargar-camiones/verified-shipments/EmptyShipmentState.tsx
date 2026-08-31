
import { ClipboardCheck, PackageSearch } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';

interface EmptyShipmentStateProps {
  title?: string;
  description?: string;
  isBulto?: boolean;
}

const EmptyShipmentState = ({ 
  title = "No hay registros verificados", 
  description = "Los escaneos completados aparecerán listados aquí.",
  isBulto = false 
}: EmptyShipmentStateProps) => {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={8} className="h-44 py-8">
        <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <div className="p-3 rounded-full bg-muted/60 text-muted-foreground/60 mb-2.5">
            {isBulto ? (
              <PackageSearch className="h-6 w-6" />
            ) : (
              <ClipboardCheck className="h-6 w-6" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default EmptyShipmentState;
