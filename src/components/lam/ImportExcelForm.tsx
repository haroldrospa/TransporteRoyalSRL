
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ImportFormValues } from '@/types/importTypes';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { isAdministrator } from '@/utils/userPermissions';

const importFormSchema = z.object({
  fechaSalida: z.string().min(1, 'Debe ingresar una fecha de salida'),
  region: z.enum(['Norte', 'Sur']),
  laboratorio: z.enum(['LAM', 'Fersuaz', 'Taapharmaceutica', 'Innovacion Quimica'], {
    required_error: 'Debe seleccionar un laboratorio'
  }),
  formatType: z.enum(['asignados', 'sin_asignar']).default('asignados')
});

interface ImportExcelFormProps {
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, values: ImportFormValues) => Promise<void>;
}

const ImportExcelForm = ({ isUploading, onFileUpload }: ImportExcelFormProps) => {
  const { user } = useAuth();
  const isAdmin = isAdministrator(user);

  const defaultLab = (user?.laboratorio && ['LAM', 'Fersuaz', 'Taapharmaceutica', 'Innovacion Quimica'].includes(user.laboratorio))
    ? (user.laboratorio as any)
    : undefined;

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      fechaSalida: format(new Date(), 'dd/MM/yyyy'),
      region: 'Norte',
      laboratorio: defaultLab,
      formatType: 'asignados'
    },
  });

  useEffect(() => {
    if (defaultLab && !form.getValues('laboratorio')) {
      form.setValue('laboratorio', defaultLab);
    }
  }, [defaultLab, form]);

  const onSubmit = (_values: ImportFormValues) => {
    document.getElementById('excelFileInput')?.click();
  };

  const formatType = form.watch('formatType');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="fechaSalida"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de salida</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  value={field.value ? convertToISODateString(field.value) : ''} 
                  onChange={(e) => {
                    try {
                      if (e.target.value) {
                        const dateString = e.target.value + 'T12:00:00';
                        const selectedDate = new Date(dateString);
                        if (!isNaN(selectedDate.getTime())) {
                          const formattedDate = format(selectedDate, 'dd/MM/yyyy');
                          field.onChange(formattedDate);
                        }
                      }
                    } catch (error) {
                      console.error('Error al formatear la fecha:', error);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground mt-1">La hora de salida siempre será a las 08:30 AM</p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="laboratorio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Laboratorio *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!isAdmin}>
                <FormControl>
                  <SelectTrigger className={!isAdmin ? "opacity-80 cursor-not-allowed bg-muted" : ""}>
                    <SelectValue placeholder="Seleccionar laboratorio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LAM">LAM</SelectItem>
                  <SelectItem value="Fersuaz">Fersuaz</SelectItem>
                  <SelectItem value="Taapharmaceutica">Taapharmaceutica</SelectItem>
                  <SelectItem value="Innovacion Quimica">Innovacion Quimica</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
              {!isAdmin && (
                <p className="text-[10px] text-muted-foreground italic mt-1">
                  * Solo el usuario administrador puede cambiar el laboratorio.
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="formatType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Formato del archivo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="asignados">Asignado a clientes (formato estándar)</SelectItem>
                  <SelectItem value="sin_asignar">Sin asignar (Fecha | Conduce # | Cliente | Bultos | Destino)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
              {formatType === 'sin_asignar' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Los conduces se importarán sin número de cliente. Razón social y ciudad se llenarán con los datos del Excel.
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Región *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar región" />
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

        <div className="hidden">
          <input
            id="excelFileInput"
            type="file"
            accept=".xlsx"
            onChange={(e) => onFileUpload(e, form.getValues())}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            'Seleccionar y Procesar Archivo'
          )}
        </Button>
      </form>
    </Form>
  );
};

const convertToISODateString = (dateStr: string): string => {
  try {
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      if (!isNaN(Number(day)) && !isNaN(Number(month)) && !isNaN(Number(year))) {
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  } catch (error) {
    console.error('Error al convertir la fecha:', error);
    return '';
  }
};

export default ImportExcelForm;
