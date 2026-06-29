
import { Conduce } from '@/types/conduces';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ConduceDetailsTableProps {
  conduces: Conduce[];
  selectedConduces: string[];
  toggleSelection: (conduceId: string) => void;
}

const ConduceDetailsTable = ({
  conduces,
  selectedConduces,
  toggleSelection,
}: ConduceDetailsTableProps) => {
  return (
    <div className="pl-10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Conduce</TableHead>
            <TableHead>Factura</TableHead>
            <TableHead>Bultos</TableHead>
            <TableHead>Encomendado</TableHead>
            <TableHead>Prioridad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conduces.map((conduce) => (
            <TableRow 
              key={conduce.id} 
              className={conduce.encomendado ? "bg-blue-50" : ""}
            >
              <TableCell>
                <Checkbox 
                  checked={selectedConduces.includes(conduce.id)} 
                  onCheckedChange={() => toggleSelection(conduce.id)}
                />
              </TableCell>
              <TableCell>{conduce.numeroConduce}</TableCell>
              <TableCell>{conduce.numeroFactura}</TableCell>
              <TableCell>{conduce.cantidadBultos}</TableCell>
              <TableCell>
                {conduce.encomendado ? (
                  <Badge className="bg-blue-500">{conduce.encomendado}</Badge>
                ) : (
                  <span className="text-muted-foreground">Sin asignar</span>
                )}
              </TableCell>
              <TableCell>
                {conduce.prioridad && (
                  <Badge className="bg-red-500">Prioridad</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConduceDetailsTable;
