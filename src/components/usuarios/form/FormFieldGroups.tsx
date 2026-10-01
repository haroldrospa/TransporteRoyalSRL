import { useState, useEffect, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { UsuarioFormData } from '@/types/usuarios';
import { Eye, EyeOff, Sparkles, Copy, Check } from 'lucide-react';
import { generateCorporateCredentials } from '@/utils/credentialsGenerator';
import { useToast } from '@/hooks/use-toast';

interface FormFieldGroupsProps {
  control: Control<UsuarioFormData>;
  setValue?: UseFormSetValue<UsuarioFormData>;
  watch?: UseFormWatch<UsuarioFormData>;
  isSubmitting: boolean;
  isChofer: boolean;
  isEditing: boolean;
}

const FormFieldGroups = ({ control, setValue, watch, isSubmitting, isChofer, isEditing }: FormFieldGroupsProps) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const isAutoEmailRef = useRef(!isEditing);
  const isAutoPasswordRef = useRef(!isEditing);

  const nombreValue = watch ? watch('nombre') : '';
  const apellidoValue = watch ? watch('apellido') : '';

  // Generación automática en vivo al escribir nombre y apellido (cuando no se ha editado manualmente)
  useEffect(() => {
    if (isEditing || !setValue) return;

    if (isAutoEmailRef.current || isAutoPasswordRef.current) {
      const creds = generateCorporateCredentials(nombreValue, apellidoValue);
      if (isAutoEmailRef.current && creds.email) {
        setValue('email', creds.email, { shouldValidate: true });
      }
      if (isAutoPasswordRef.current && creds.password) {
        setValue('password', creds.password, { shouldValidate: true });
      }
    }
  }, [nombreValue, apellidoValue, isEditing, setValue]);

  const handleGenerateCredentials = () => {
    if (!setValue) return;
    const creds = generateCorporateCredentials(nombreValue, apellidoValue);
    if (!creds.email && !creds.password) {
      toast({
        title: 'Información incompleta',
        description: 'Escriba al menos el Nombre para generar credenciales empresariales',
        variant: 'destructive',
      });
      return;
    }
    if (creds.email) setValue('email', creds.email, { shouldValidate: true });
    if (creds.password) setValue('password', creds.password, { shouldValidate: true });
    isAutoEmailRef.current = true;
    isAutoPasswordRef.current = true;
    setShowPassword(true);
    toast({
      title: 'Credenciales corporativas generadas',
      description: `${creds.email} / ${creds.password}`,
    });
  };

  const handleCopy = (text: string, field: 'email' | 'password') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      description: `${field === 'email' ? 'Correo' : 'Contraseña'} copiado al portapapeles`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

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

      {/* Banner / Botón de generación corporativa */}
      <div className="col-span-1 md:col-span-2 flex items-center justify-between bg-blue-50/70 border border-blue-200/80 rounded-lg p-2 px-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-royal-blue shrink-0" />
          <span className="text-xs font-medium text-blue-900">
            Credenciales corporativas automáticas (@transroyal.com)
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateCredentials}
          className="h-7 text-xs bg-white text-royal-blue border-blue-300 hover:bg-blue-100 flex items-center gap-1.5 shadow-xs"
        >
          <Sparkles className="h-3 w-3 text-royal-blue" />
          Generar credenciales
        </Button>
      </div>

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>Email *</FormLabel>
              {field.value && (
                <button
                  type="button"
                  onClick={() => handleCopy(field.value, 'email')}
                  className="text-xs text-muted-foreground hover:text-royal-blue flex items-center gap-1 transition-colors"
                  tabIndex={-1}
                >
                  {copiedField === 'email' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className={copiedField === 'email' ? 'text-green-600' : ''}>
                    {copiedField === 'email' ? 'Copiado' : 'Copiar'}
                  </span>
                </button>
              )}
            </div>
            <FormControl>
              <Input 
                {...field} 
                type="email" 
                placeholder="email@transroyal.com" 
                disabled={isSubmitting}
                onChange={(e) => {
                  isAutoEmailRef.current = false;
                  field.onChange(e);
                }}
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
            <div className="flex items-center justify-between">
              <FormLabel>
                {isEditing ? 'Contraseña (en blanco = mantener)' : 'Contraseña *'}
              </FormLabel>
              {field.value && (
                <button
                  type="button"
                  onClick={() => handleCopy(field.value, 'password')}
                  className="text-xs text-muted-foreground hover:text-royal-blue flex items-center gap-1 transition-colors"
                  tabIndex={-1}
                >
                  {copiedField === 'password' ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className={copiedField === 'password' ? 'text-green-600' : ''}>
                    {copiedField === 'password' ? 'Copiada' : 'Copiar'}
                  </span>
                </button>
              )}
            </div>
            <FormControl>
              <div className="relative">
                <Input 
                  {...field} 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder={isEditing ? 'Mantener actual' : 'RoyalNombre2026*'} 
                  disabled={isSubmitting}
                  className="pr-10"
                  onChange={(e) => {
                    isAutoPasswordRef.current = false;
                    field.onChange(e);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
