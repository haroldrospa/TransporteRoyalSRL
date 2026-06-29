
import { useState } from 'react';
import { Conduce } from '@/types/conduces';
import { Usuario } from '@/types/usuarios';
import { Loader2, GitBranch } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProcessingOverlay from '@/components/cargar-camiones/ProcessingOverlay';

interface ConducesAsignadosProps {
  encomendadosList: string[];
  loading: boolean;
  getConducesByEncomendado: (encomendado: string) => Conduce[];
  clientes: any[];
  refreshData?: () => void;
}

const ConducesAsignados = ({
  encomendadosList,
  loading,
  getConducesByEncomendado,
  clientes,
  refreshData
}: ConducesAsignadosProps) => {
  const [isDividing, setIsDividing] = useState(false);

  // Función para dividir los conduces de Almacén
  const handleDividirAlmacen = async () => {
    setIsDividing(true);
    try {
      const almacenConduces = getConducesByEncomendado('Almacen');
      
      console.log('🔍 [Dividir] Total conduces en Almacen:', almacenConduces.length);
      console.log('🔍 [Dividir] Total clientes disponibles:', clientes.length);
      
      if (almacenConduces.length === 0) {
        toast({
          title: "Información",
          description: "No hay conduces asignados a Almacén",
        });
        return;
      }

      let reasignados = 0;
      let sinAsignar = 0;
      const diaActual = new Date().getDay(); // 0 = Domingo, 6 = Sábado
      
      console.log('📅 [Dividir] Día actual:', diaActual, ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaActual]);

      for (const conduce of almacenConduces) {
        let encomendadoAsignado = null;
        
        console.log(`\n📦 [Dividir] Procesando conduce ${conduce.numeroConduce}:`);
        console.log(`   - Cliente: ${conduce.numeroCliente}`);
        console.log(`   - Ciudad: ${conduce.ciudad}`);
        
        // Buscar el cliente para obtener su encomendado por defecto
        const cliente = clientes.find(c => c.numeroCliente === conduce.numeroCliente);
        
        if (cliente) {
          console.log(`   ✅ Cliente encontrado:`, {
            numeroCliente: cliente.numeroCliente,
            razonSocial: cliente.razonSocial,
            encomendado: cliente.encomendado,
            ciudad: cliente.ciudad
          });
        } else {
          console.log(`   ❌ Cliente NO encontrado en la lista`);
        }
        
        // Prioridad 1: Encomendado por defecto del cliente
        if (cliente?.encomendado) {
          encomendadoAsignado = cliente.encomendado;
          console.log(`   ✅ Usando encomendado del cliente: ${encomendadoAsignado}`);
        } 
        // Prioridad 2: Buscar en rutas_asignaciones por ciudad y día
        else if (conduce.ciudad) {
          console.log(`   🔍 Buscando en rutas_asignaciones para ciudad: ${conduce.ciudad}, día: ${diaActual}`);
          
          const { data: ruta, error: rutaError } = await supabase
            .from('rutas_asignaciones')
            .select('encomendado')
            .eq('ciudad', conduce.ciudad)
            .eq('dia_semana', diaActual)
            .single();
          
          if (rutaError) {
            console.log(`   ⚠️ Error o no encontrado en rutas_asignaciones:`, rutaError.message);
          }
          
          if (ruta?.encomendado) {
            encomendadoAsignado = ruta.encomendado;
            console.log(`   ✅ Usando encomendado de ruta: ${encomendadoAsignado}`);
          } else {
            console.log(`   ❌ No se encontró ruta para ciudad ${conduce.ciudad} en día ${diaActual}`);
          }
        }
        
        // Solo actualizar si encontramos un encomendado válido
        if (encomendadoAsignado) {
          const { error } = await supabase
            .from('conduces')
            .update({ encomendado: encomendadoAsignado })
            .eq('id', conduce.id);
          
          if (!error) {
            reasignados++;
            console.log(`   ✅ Conduce ${conduce.numeroConduce} ASIGNADO a ${encomendadoAsignado}`);
          } else {
            console.error(`   ❌ Error actualizando conduce:`, error);
          }
        } else {
          sinAsignar++;
          console.log(`   ⚠️ Conduce ${conduce.numeroConduce} quedará sin asignar (no se encontró encomendado)`);
        }
      }

      // Refrescar los datos
      if (refreshData) {
        await refreshData();
      }

      console.log(`\n✅ [Dividir] Proceso completado:`);
      console.log(`   - Reasignados: ${reasignados}`);
      console.log(`   - Sin asignar: ${sinAsignar}`);

      toast({
        title: "División completada",
        description: `${reasignados} conduces reasignados${sinAsignar > 0 ? `, ${sinAsignar} sin asignar (sin encomendado definido)` : ''}`,
      });

    } catch (error) {
      console.error('❌ Error dividiendo conduces:', error);
      toast({
        title: "Error",
        description: "No se pudieron dividir los conduces",
        variant: "destructive"
      });
    } finally {
      setIsDividing(false);
    }
  };
  return (
    <>
      <ProcessingOverlay 
        isProcessing={isDividing} 
        message="Reasignando conduces a cada chofer..." 
      />
      <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Conduces Asignados</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-royal-blue" />
            <span className="ml-2 text-lg">Cargando conduces asignados...</span>
          </div>
        ) : (
          <Tabs defaultValue={encomendadosList[0]}>
            <TabsList className="w-full overflow-x-auto flex justify-start">
              {encomendadosList.map(enc => (
                <TabsTrigger key={enc} value={enc} className="flex-1">{enc}</TabsTrigger>
              ))}
            </TabsList>
            
            {encomendadosList.map(enc => {
              const encomendadoConduces = getConducesByEncomendado(enc);
              const totalBultos = encomendadoConduces.reduce((sum, c) => sum + c.cantidadBultos, 0);
              const totalClientes = new Set(encomendadoConduces.map(c => c.numeroCliente)).size;
              
              return (
                <TabsContent key={enc} value={enc}>
                  <div className="p-4 border rounded-md bg-muted/30">
                    {/* Botón Dividir solo para Almacén */}
                    {enc === 'Almacen' && encomendadoConduces.length > 0 && (
                      <div className="mb-4">
                        <Button 
                          onClick={handleDividirAlmacen}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <GitBranch className="h-4 w-4 mr-2" />
                          Dividir
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="bg-white p-3 rounded-md shadow flex-1">
                        <p className="text-xs text-muted-foreground uppercase">Conduces</p>
                        <p className="text-2xl font-bold">{encomendadoConduces.length}</p>
                      </div>
                      <div className="bg-white p-3 rounded-md shadow flex-1">
                        <p className="text-xs text-muted-foreground uppercase">Bultos</p>
                        <p className="text-2xl font-bold">{totalBultos}</p>
                      </div>
                      <div className="bg-white p-3 rounded-md shadow flex-1">
                        <p className="text-xs text-muted-foreground uppercase">Clientes</p>
                        <p className="text-2xl font-bold">{totalClientes}</p>
                      </div>
                    </div>
                    
                    {encomendadoConduces.length > 0 ? (
                      <div className="overflow-auto max-h-64 rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Conduce</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Razón Social</TableHead>
                              <TableHead>Bultos</TableHead>
                              <TableHead>Fecha Salida</TableHead>
                              <TableHead>Prioridad</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {encomendadoConduces.map((conduce) => (
                              <TableRow key={conduce.id}>
                                <TableCell>{conduce.numeroConduce}</TableCell>
                                <TableCell>{conduce.numeroCliente}</TableCell>
                                <TableCell>{conduce.razonSocial}</TableCell>
                                <TableCell>{conduce.cantidadBultos}</TableCell>
                                <TableCell>{conduce.fechaEntrega}</TableCell>
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
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay conduces asignados a este encomendado
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
    </>
  );
};

export default ConducesAsignados;
