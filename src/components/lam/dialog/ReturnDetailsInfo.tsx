import { RotateCcw, Package, AlertCircle } from 'lucide-react';

interface ReturnDetailsInfoProps {
  cantidadBultos: number;
  cantidadEntregados?: number;
  motivoDevolucion?: string;
  nota?: string;
}

export const ReturnDetailsInfo = ({
  cantidadBultos,
  cantidadEntregados,
  motivoDevolucion,
  nota
}: ReturnDetailsInfoProps) => {
  const cantidadDevueltos = cantidadBultos - (cantidadEntregados || 0);

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
      <div className="flex items-center gap-2 text-blue-700">
        <RotateCcw className="h-4 w-4" />
        <h4 className="font-semibold text-sm">Información de Devolución</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-100">
          <Package className="h-3.5 w-3.5 text-blue-600" />
          <div>
            <p className="text-xs text-blue-600 font-medium">Bultos Originales</p>
            <p className="text-sm font-semibold text-blue-800">{cantidadBultos}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-100">
          <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
          <div>
            <p className="text-xs text-blue-600 font-medium">Bultos Devueltos</p>
            <p className="text-sm font-semibold text-blue-800">{cantidadDevueltos}</p>
          </div>
        </div>
      </div>

      {(motivoDevolucion || nota) && (
        <div className="space-y-2">
          {motivoDevolucion && (
            <div className="flex items-start gap-2 p-2 bg-white rounded border border-blue-100">
              <AlertCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium">Motivo de Devolución</p>
                <p className="text-sm text-blue-800">{motivoDevolucion}</p>
              </div>
            </div>
          )}
          
          {nota && (
            <div className="flex items-start gap-2 p-2 bg-white rounded border border-blue-100">
              <AlertCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium">Nota Adicional</p>
                <p className="text-sm text-blue-800">{nota}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};