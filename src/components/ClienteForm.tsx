import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cliente } from '@/types/cliente';
import { PROVINCIAS_CIUDADES, LISTA_PROVINCIAS, encontrarProvinciaPorCiudad } from '@/constants/provinciasCiudades';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

// Define the schema with required fields matching the Cliente type
const clienteSchema = z.object({
  rnc: z.string().optional(),
  numeroCliente: z.string().min(1, 'El número de cliente es requerido'),
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  encomendado: z.string().optional(),
  ruta: z.string().optional(),
  contacto: z.string().optional(),
  direccion: z.string().optional(),
  ubicacion: z.string().optional(),
  zona: z.enum(['Norte', 'Sur', 'Este'], {
    required_error: 'Debe seleccionar una zona',
  }),
});

export type ClienteFormSchema = z.infer<typeof clienteSchema>;

export interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (cliente: ClienteFormSchema) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ClienteForm: React.FC<ClienteFormProps> = ({
  cliente,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const form = useForm<ClienteFormSchema>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      rnc: cliente?.rnc || '',
      numeroCliente: cliente?.numeroCliente || '',
      razonSocial: cliente?.razonSocial || '',
      ciudad: cliente?.ciudad || '',
      encomendado: cliente?.encomendado || '',
      ruta: cliente?.ruta || '',
      contacto: cliente?.contacto || '',
      direccion: cliente?.direccion || '',
      ubicacion: cliente?.ubicacion || '',
      zona: cliente?.zona || 'Norte',
    },
    mode: 'onChange',
  });

  const [selectedProvincia, setSelectedProvincia] = useState<string>(() => {
    if (cliente?.ciudad) {
      return encontrarProvinciaPorCiudad(cliente.ciudad) || '';
    }
    return '';
  });

  const [customCiudades, setCustomCiudades] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('custom_ciudades_rep_dom');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const [isAddCiudadOpen, setIsAddCiudadOpen] = useState(false);
  const [newCiudadName, setNewCiudadName] = useState('');

  const getCiudadesParaProvincia = (provincia: string): string[] => {
    if (!provincia) return [];
    
    const predefinidas = PROVINCIAS_CIUDADES[provincia] || [];
    const personalizadas = customCiudades[provincia] || [];
    
    const todas = new Set([...predefinidas, ...personalizadas]);
    
    if (cliente?.ciudad && encontrarProvinciaPorCiudad(cliente.ciudad) === provincia) {
      const existeEquivalente = Array.from(todas).some(
        c => c.toLowerCase().trim() === cliente.ciudad.toLowerCase().trim()
      );
      if (!existeEquivalente) {
        todas.add(cliente.ciudad);
      }
    }
    
    return Array.from(todas).sort();
  };

  const handleAddCustomCiudad = (nuevaCiudad: string) => {
    if (!selectedProvincia || !nuevaCiudad.trim()) return;
    const trimmed = nuevaCiudad.trim();
    setCustomCiudades(prev => {
      const updated = {
        ...prev,
        [selectedProvincia]: Array.from(new Set([...(prev[selectedProvincia] || []), trimmed]))
      };
      localStorage.setItem('custom_ciudades_rep_dom', JSON.stringify(updated));
      return updated;
    });
    form.setValue('ciudad', trimmed, { shouldDirty: true, shouldValidate: true });
  };

  const { isSubmitting: formIsSubmitting, isValid } = form.formState;

  const handleSubmit = async (values: ClienteFormSchema) => {
    await onSubmit(values);
  };
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="rnc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RNC</FormLabel>
                <FormControl>
                  <Input placeholder="RNC del cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numeroCliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="Número de Cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="razonSocial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón Social</FormLabel>
                <FormControl>
                  <Input placeholder="Razón Social" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormItem className="flex flex-col justify-end">
              <FormLabel className="mb-2">Provincia</FormLabel>
              <Select 
                value={selectedProvincia} 
                onValueChange={(val) => {
                  setSelectedProvincia(val);
                  form.setValue('ciudad', '', { shouldDirty: true, shouldValidate: true });
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una provincia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[250px]">
                  {LISTA_PROVINCIAS.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {prov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormField
              control={form.control}
              name="ciudad"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-end">
                  <div className="flex justify-between items-center mb-1">
                    <FormLabel>Ciudad / Municipio</FormLabel>
                    {selectedProvincia && (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-royal-blue text-xs flex items-center gap-1 hover:text-royal-yellow transition-colors"
                        onClick={() => setIsAddCiudadOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar ciudad
                      </Button>
                    )}
                  </div>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedProvincia}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedProvincia ? "Selecciona una ciudad" : "Selecciona provincia"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[250px]">
                      {getCiudadesParaProvincia(selectedProvincia).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="encomendado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Encomendado</FormLabel>
                <FormControl>
                  <Input placeholder="Encomendado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ruta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ruta</FormLabel>
                <FormControl>
                  <Input placeholder="Ruta" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contacto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="Contacto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Calle Roberto Colón #12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ubicacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coordenadas GPS (para mapa)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 18.4861,-69.9312" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zona"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zona</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una zona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Norte">Norte</SelectItem>
                    <SelectItem value="Sur">Sur</SelectItem>
                    <SelectItem value="Este">Este</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={isAddCiudadOpen} onOpenChange={setIsAddCiudadOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Agregar Nueva Ciudad</DialogTitle>
            <DialogDescription>
              Agrega una nueva ciudad o municipio para la provincia <strong>{selectedProvincia}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-ciudad">Nombre de la ciudad / municipio</Label>
              <Input 
                id="nombre-ciudad" 
                placeholder="Ej. Cabarete" 
                value={newCiudadName}
                onChange={(e) => setNewCiudadName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newCiudadName.trim()) {
                      handleAddCustomCiudad(newCiudadName.trim());
                      setNewCiudadName('');
                      setIsAddCiudadOpen(false);
                    }
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsAddCiudadOpen(false);
              setNewCiudadName('');
            }}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                if (newCiudadName.trim()) {
                  handleAddCustomCiudad(newCiudadName.trim());
                  setNewCiudadName('');
                  setIsAddCiudadOpen(false);
                }
              }}
              disabled={!newCiudadName.trim()}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClienteForm;
