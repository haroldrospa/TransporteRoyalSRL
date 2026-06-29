
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BultoModificationSectionProps {
  cantidadBultos: number;
  cantidadEntregados?: number;
  onBultosChange: (value: number, note: string) => void;
  disabled?: boolean;
}

const BultoModificationSection = ({
  cantidadBultos,
  cantidadEntregados,
  onBultosChange,
  disabled = false
}: BultoModificationSectionProps) => {
  // Always start with original cantidadBultos as default value
  const [bultosEntregados, setBultosEntregados] = useState(cantidadBultos);
  const [modificationNote, setModificationNote] = useState('');
  const [showNoteWarning, setShowNoteWarning] = useState(false);
  
  // Update local state when cantidadBultos changes
  useEffect(() => {
    setBultosEntregados(cantidadBultos);
  }, [cantidadBultos]);
  
  const isReduction = bultosEntregados < cantidadBultos;
  const noteRequired = isReduction;

  const handleBultosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    
    // Don't allow more than the original number of bultos
    const newValue = Math.min(value, cantidadBultos);
    
    // Don't allow negative values
    const finalValue = Math.max(0, newValue);
    setBultosEntregados(finalValue);
    
    // Show note warning if reducing bultos and note is empty
    const isReducing = finalValue < cantidadBultos;
    setShowNoteWarning(isReducing && !modificationNote);
    
    // Update parent component
    onBultosChange(finalValue, modificationNote);
  };
  
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const note = e.target.value;
    setModificationNote(note);
    setShowNoteWarning(isReduction && !note);
    
    // Update parent component
    onBultosChange(bultosEntregados, note);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            id="bultosEntregados" 
            value={bultosEntregados} 
            onChange={handleBultosChange}
            min={0}
            max={cantidadBultos}
            className="w-24"
            disabled={disabled}
          />
          <span className="text-sm text-gray-500">
            de {cantidadBultos} bultos totales
          </span>
        </div>
      </div>
      
      {(isReduction || modificationNote) && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="modificationNote">
            Nota de Modificación {noteRequired && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="modificationNote"
            placeholder="Explique por qué se modificó la cantidad de bultos entregados"
            value={modificationNote}
            onChange={handleNoteChange}
            className={noteRequired && showNoteWarning ? "border-red-500" : ""}
            disabled={disabled}
          />
          
          {noteRequired && showNoteWarning && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Es necesario incluir una nota al reducir la cantidad de bultos entregados.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default BultoModificationSection;
