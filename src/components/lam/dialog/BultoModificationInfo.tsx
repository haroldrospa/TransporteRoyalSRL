
import { Pencil } from 'lucide-react';

interface BultoModificationInfoProps {
  original: number;
  entregados: number;
  note: string;
}

const BultoModificationInfo = ({ original, entregados, note }: BultoModificationInfoProps) => {
  // Solo renderizar si hay una modificación real (diferencia en cantidades)
  if (original === entregados) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
      <div className="flex items-center text-amber-700 mb-2">
        <Pencil className="h-4 w-4 mr-2" />
        <h4 className="font-medium">Modificación de Bultos</h4>
      </div>
      
      <div className="space-y-2 text-amber-900">
        <p className="flex justify-between">
          <span>Bultos Originales:</span>
          <span className="font-medium">{original}</span>
        </p>
        
        <p className="flex justify-between">
          <span>Bultos Entregados:</span>
          <span className="font-medium">{entregados}</span>
        </p>
        
        <div>
          <p className="font-medium mb-1">Motivo:</p>
          <p className="text-sm bg-white bg-opacity-50 p-2 rounded">{note || 'Sin nota'}</p>
        </div>
      </div>
    </div>
  );
};

export default BultoModificationInfo;
