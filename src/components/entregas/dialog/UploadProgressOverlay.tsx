
import { Loader2, Truck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadProgressOverlayProps {
  isSubmitting: boolean;
  backgroundUpload: boolean;
  uploadProgress: number;
}

export const UploadProgressOverlay = ({
  isSubmitting,
  backgroundUpload,
  uploadProgress
}: UploadProgressOverlayProps) => {
  if (!isSubmitting || backgroundUpload) return null;
  
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center rounded-lg z-50">
      <div className="bg-card p-8 rounded-2xl shadow-2xl text-center max-w-xs animate-scale-in border border-border/50">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 animate-pulse opacity-20" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Truck className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="text-base font-semibold text-foreground">Procesando entrega</p>
        <p className="text-sm text-muted-foreground mt-1.5">Por favor espere...</p>
        <div className="mt-5">
          <Progress 
            value={uploadProgress} 
            className="h-2 rounded-full overflow-hidden"
            indicatorClassName="bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
          />
          <p className="text-xs text-muted-foreground mt-2 font-medium tabular-nums">{uploadProgress}%</p>
        </div>
      </div>
    </div>
  );
};
