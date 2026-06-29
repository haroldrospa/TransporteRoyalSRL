import { useState, useRef } from 'react';
import { Upload, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { processConduceExcel } from '@/utils/excelImport';
import ImportExcelForm from '@/components/lam/ImportExcelForm';
import DuplicateConducesDialog from '@/components/lam/DuplicateConducesDialog';
import { ImportFormValues } from '@/types/importTypes';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Region } from '@/types/conduces';

interface ImportExcelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => Promise<void>;
}

const ImportExcelDialog = ({ isOpen, onOpenChange, onImportSuccess }: ImportExcelDialogProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isForcing, setIsForcing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [createdClients, setCreatedClients] = useState<string[]>([]);
  const [showDuplicateConduces, setShowDuplicateConduces] = useState(false);
  const [duplicateConduces, setDuplicateConduces] = useState<Array<{
    numeroConduce: string;
    numeroFactura: string;
    numeroCliente: string;
    razonSocial?: string;
  }>>([]);
  const isMobile = useIsMobile();
  
  // Store the last file and form values for forcing duplicates
  const lastFileRef = useRef<File | null>(null);
  const lastValuesRef = useRef<ImportFormValues | null>(null);

  const processFile = async (file: File, values: ImportFormValues, forceDuplicates: boolean = false) => {
    setIsUploading(true);
    try {
      const result = await processConduceExcel(
        file, 
        values.laboratorio, // Pass the selected laboratorio
        "", // Empty string since fechaCarga now comes from Excel
        values.fechaSalida,
        values.region as Region,
        forceDuplicates,
        values.formatType ?? 'asignados'
      );
      
      if (result.success) {
        toast({
          title: "Importación exitosa",
          description: result.message,
        });
        
        if (result.createdClients && result.createdClients.length > 0) {
          setCreatedClients(result.createdClients);
        }
        
        if (result.errors && result.errors.length > 0) {
          setErrors(result.errors);
        } else {
          onOpenChange(false);
          setShowDuplicateConduces(false);
          await onImportSuccess();
        }
      } else {
        const errors = result.errors || ['Error desconocido durante la importación'];
        setErrors(errors);
        
        // Check if there are duplicate conduces
        if (result.duplicateConduces && result.duplicateConduces.length > 0) {
          setDuplicateConduces(result.duplicateConduces);
          setShowDuplicateConduces(true);
        }
        
        toast({
          title: "Error en la importación",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error during import:', error);
      setErrors([(error as Error).message]);
      toast({
        title: "Error",
        description: "Ocurrió un error durante la importación",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, values: ImportFormValues) => {
    const file = e.target.files?.[0];
    setErrors([]);
    setCreatedClients([]);
    setDuplicateConduces([]);
    
    if (!file) {
      toast({
        title: "Error",
        description: "No se seleccionó ningún archivo",
        variant: "destructive"
      });
      return;
    }

    if (!file.name.endsWith('.xlsx')) {
      toast({
        title: "Formato incorrecto",
        description: "El archivo debe ser de tipo Excel (.xlsx)",
        variant: "destructive"
      });
      return;
    }

    // Store file and values for potential force duplicate
    lastFileRef.current = file;
    lastValuesRef.current = values;

    await processFile(file, values, false);
    e.target.value = '';
  };

  const handleForceDuplicate = async () => {
    if (!lastFileRef.current || !lastValuesRef.current) {
      toast({
        title: "Error",
        description: "No hay archivo para procesar",
        variant: "destructive"
      });
      return;
    }

    setIsForcing(true);
    try {
      await processFile(lastFileRef.current, lastValuesRef.current, true);
      setShowDuplicateConduces(false);
    } finally {
      setIsForcing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="bg-royal-blue"
          size={isMobile ? "sm" : "default"}
        >
          <Upload className="h-4 w-4" />
          {isMobile ? "" : "Cargar Archivo"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cargar archivo de conduces</DialogTitle>
          <DialogDescription>
            Importar conduces desde archivo Excel (.xlsx)
          </DialogDescription>
        </DialogHeader>
        
        {createdClients.length > 0 && (
          <Alert className="mt-2 bg-amber-50 border-amber-200">
            <Check className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600">Se crearon clientes nuevos</AlertTitle>
            <AlertDescription>
              <div className="text-sm text-amber-800 mb-1">
                Se crearon {createdClients.length} cliente(s) con datos vacíos que necesitarán ser completados:
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {createdClients.map((clientNum, idx) => (
                  <Badge key={idx} variant="outline" className="bg-amber-100 border-amber-300 text-amber-800">
                    {clientNum}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {errors.length > 0 && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm font-medium mb-1">Se encontraron errores durante la importación:</div>
              <ul className="list-disc pl-5 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <ImportExcelForm 
          isUploading={isUploading}
          onFileUpload={handleFileUpload}
        />
        
        {(errors.length > 0 || createdClients.length > 0) && (
          <div className="flex justify-end mt-2">
            <Button 
              onClick={() => {
                setErrors([]);
                setCreatedClients([]);
                onImportSuccess();
                onOpenChange(false);
              }}
              variant="outline"
            >
              Continuar
            </Button>
          </div>
        )}
      </DialogContent>
      
      <DuplicateConducesDialog 
        isOpen={showDuplicateConduces}
        onOpenChange={setShowDuplicateConduces}
        duplicateConduces={duplicateConduces}
        onForceDuplicate={handleForceDuplicate}
        isForcing={isForcing}
      />
    </Dialog>
  );
};

export default ImportExcelDialog;
