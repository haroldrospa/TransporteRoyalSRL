
import { AlertTriangle, PackageCheck } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Conduce } from '@/types/conduces';

interface AdditionalConducesWarningProps {
  currentConduce: Conduce;
  additionalConduces: Conduce[];
}

export const AdditionalConducesWarning = ({ currentConduce, additionalConduces }: AdditionalConducesWarningProps) => {
  if (!additionalConduces || additionalConduces.length === 0) return null;

  // Calculate total bultos (current conduce + additional conduces)
  const totalBultos = currentConduce.cantidadBultos + additionalConduces.reduce((sum, c) => sum + c.cantidadBultos, 0);

  return (
    <Alert variant="destructive" className="bg-amber-50 border-amber-300 text-amber-800">
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-800">
        Este cliente tiene {additionalConduces.length} conduce(s) adicional(es) pendiente(s):
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3 mt-2">
          {additionalConduces.map(conduce => (
            <div key={conduce.id} className="flex items-center gap-2 text-sm">
              <PackageCheck className="h-4 w-4 text-amber-500" />
              <span>Conduce: {conduce.numeroConduce} - {conduce.cantidadBultos} bultos</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-amber-300">
            <div className="flex items-center gap-2 text-base font-semibold">
              <PackageCheck className="h-5 w-5 text-amber-600" />
              <span>Total de bultos a entregar en este cliente: {totalBultos} bultos</span>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
