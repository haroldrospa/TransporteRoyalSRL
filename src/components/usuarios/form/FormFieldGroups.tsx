import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control, UseFormSetValue } from 'react-hook-form';
import { UsuarioFormData } from '@/types/usuarios';

interface FormFieldGroupsProps {
  control: Control<UsuarioFormData>;
  setValue?: UseFormSetValue<UsuarioFormData>;
  isSubmitting: boolean;
  isChofer: boolean;
  isEditing: boolean;
}

const FormFieldGroups = ({ control, setValue, isSubmitting, isChofer, isEditing }: FormFieldGroupsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name="nombre"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Nombre *</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="Nombre" 
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="apellido"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Apellido *</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="Apellido" 
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Email *</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                type="email" 
                placeholder="email@transroyal.com" 
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Contraseña {isEditing ? '(Dejar en blanco para mantener actual)' : '*'}</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                type="password" 
                placeholder="********" 
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="nivel"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Nivel de Acceso *</FormLabel>
            <FormControl>
              <select
                {...field}
                value={field.value}
                onChange={(e) => {
                  const newNivel = parseInt(e.target.value);
                  field.onChange(newNivel);
                  if (setValue) {
                    if (newNivel === 7) {
                      setValue('puesto', 'Escaneador de bultos');
                    } else if (newNivel === 3) {
                      setValue('puesto', 'Escaneador de conduces');
                    } else if (newNivel === 1) {
                      setValue('puesto', 'Chofer');
                    } else if (newNivel === 5) {
                      setValue('puesto', 'Administrador');
                    } else if (newNivel === 2) {
                      setValue('puesto', 'Laboratorio');
                    }
                  }
                }}
                className="w-full p-2 border rounded-md"
                disabled={isSubmitting}
              >
                <option value={1}>Nivel 1 - Entregas (Chofer)</option>
                <option value={2}>Nivel 2 - LAM (Solo lectura)</option>
                <option value={3}>Nivel 3 - Control Bultos y Cargar Camiones (Escaneador de conduces)</option>
                <option value={4}>Nivel 4 - Acceso completo</option>
                <option value={5}>Nivel 5 - Administrador</option>
                <option value={6}>Nivel 6 - LAM y Entregas</option>
                <option value={7}>Nivel 7 - Solo Cargar Camiones (Escaneador de bultos)</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="puesto"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Puesto *</FormLabel>
            <FormControl>
              <select
                {...field}
                className="w-full p-2 border rounded-md"
                disabled={isSubmitting}
                onChange={(e) => {
                  const newPuesto = e.target.value;
                  field.onChange(e);
                  if (setValue) {
                    if (newPuesto === 'Escaneador de bultos') {
                      setValue('nivel', 7);
                    } else if (newPuesto === 'Escaneador de conduces' || newPuesto === 'Despachador') {
                      setValue('nivel', 3);
                    } else if (newPuesto === 'Chofer') {
                      setValue('nivel', 1);
                    } else if (newPuesto === 'Administrador') {
                      setValue('nivel', 5);
                    } else if (newPuesto === 'Laboratorio') {
                      setValue('nivel', 2);
                    }
                  }
                }}
              >
                <option value="Administrador">Administrador</option>
                <option value="Chofer">Chofer</option>
                <option value="Laboratorio">Laboratorio</option>
                <option value="Escaneador de conduces">Escaneador de conduces</option>
                <option value="Escaneador de bultos">Escaneador de bultos</option>
                <option value="Despachador">Despachador</option>
                <option value="LAM">LAM</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {isChofer && (
        <FormField
          control={control}
          name="camion"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Camión Asignado {isChofer ? '*' : ''}</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full p-2 border rounded-md"
                  disabled={isSubmitting}
                >
                  <option value="">Seleccionar camión</option>
                  <option value="R-01">R-01</option>
                  <option value="R-02">R-02</option>
                  <option value="R-03">R-03</option>
                  <option value="R-04">R-04</option>
                  <option value="R-05">R-05</option>
                  <option value="R-06">R-06</option>
                  <option value="R-07">R-07</option>
                  <option value="R-08">R-08</option>
                  <option value="C-01">C-01</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="laboratorio"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Laboratorio Asignado</FormLabel>
            <FormControl>
              <select
                {...field}
                value={field.value || ''}
                className="w-full p-2 border rounded-md"
                disabled={isSubmitting}
              >
                <option value="">Sin asignar (ve todos)</option>
                <option value="LAM">LAM</option>
                <option value="Fersuaz">Fersuaz</option>
                <option value="Taapharmaceutica">Taapharmaceutica</option>
                <option value="Innovacion Quimica">Innovacion Quimica</option>
                <option value="Krishpar Care Dominicana">Krishpar Care Dominicana</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default FormFieldGroups;
