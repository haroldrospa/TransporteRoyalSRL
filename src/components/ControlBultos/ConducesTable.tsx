
import { Conduce } from '@/types/conduces';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Clock } from 'lucide-react';
import TransitTimeDisplay from '@/components/shared/TransitTimeDisplay';

interface ConducesTableProps {
  conduces: Conduce[];
  selectedConduces: string[];
  toggleSelection: (conduceId: string) => void;
  setSelectedConduces: (ids: string[]) => void;
}

const ConducesTable = ({
  conduces,
  selectedConduces,
  toggleSelection,
  setSelectedConduces,
}: ConducesTableProps) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={conduces.length > 0 && selectedConduces.length === conduces.length} 
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedConduces(conduces.map(c => c.id));
                    } else {
                      setSelectedConduces([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Conduce</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Razón Social</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Bultos</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead>Encomendado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tiempo en Tránsito
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conduces.length > 0 ? (
              conduces.map((conduce) => (
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
                  <TableCell>{conduce.numeroCliente}</TableCell>
                  <TableCell>{conduce.razonSocial}</TableCell>
                  <TableCell>{conduce.ciudad}</TableCell>
                  <TableCell>{conduce.cantidadBultos}</TableCell>
                  <TableCell>
                    {conduce.ruta ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Ruta {conduce.ruta}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
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
                  <TableCell>
                    <TransitTimeDisplay 
                      fechaEntrega={conduce.fechaEntrega} 
                      estado={conduce.estado} 
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center h-24">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No hay conduces en tránsito</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ConducesTable;
