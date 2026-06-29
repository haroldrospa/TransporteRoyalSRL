
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ClienteTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>RNC</TableHead>
        <TableHead>Número</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Razón Social</TableHead>
        <TableHead>Ciudad</TableHead>
        <TableHead>Zona</TableHead>
        <TableHead>Encomendado</TableHead>
        <TableHead>Ruta</TableHead>
        <TableHead>Contacto</TableHead>
        <TableHead>Ubicación</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ClienteTableHeader;
