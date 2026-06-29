import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, MessageSquare, AlertTriangle, PenLine, ImageIcon, ZoomIn } from 'lucide-react';
import SignatureDisplay from '@/components/SignatureDisplay';
import { LazyImageDisplay } from './LazyImageDisplay';
import { Button } from '@/components/ui/button';
import { ImageDisplayModal } from './ImageDisplayModal';
import BultoModificationInfo from './BultoModificationInfo';

interface DeliveryReadOnlyDetailsProps {
  firma: string | null;
  imagen: string | null;
  nota: string | null;
  excepcion: boolean;
  motivoExcepcion: string | null;
  bultoModification?: {
    original: number;
    entregados: number;
    note: string;
  } | null;
  tiempoEntrega?: string;
  parseDeliveryTime?: (timeStr: string) => number;
  numeroCliente?: string;
}

export const DeliveryReadOnlyDetails = ({
  firma,
  imagen,
  nota,
  excepcion,
  motivoExcepcion,
  bultoModification,
  tiempoEntrega,
  parseDeliveryTime,
  numeroCliente
}: DeliveryReadOnlyDetailsProps) => {
  const [showImageModal, setShowImageModal] = useState(false);

  // Determine grid columns based on what's available
  const hasFirma = !!firma;
  const hasImagen = !!imagen;
  
  let gridCols = "grid-cols-1";
  const itemsCount = (hasFirma ? 1 : 0) + (hasImagen ? 1 : 0);
  
  if (itemsCount === 2) gridCols = "grid-cols-1 sm:grid-cols-2";

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
        <Info className="h-4 w-4 text-royal-blue" />
        Detalles de Entrega
      </h3>
      
      {nota && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group flex flex-col gap-2 p-3 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
              <MessageSquare className="h-3.5 w-3.5 text-royal-blue" />
            </div>
            <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nota</h4>
          </div>
          <p className="text-sm bg-background/50 p-2.5 rounded-md border border-border/30 text-foreground/90 font-medium">{nota}</p>
        </motion.div>
      )}
      
      {excepcion && (
        <div className="group flex flex-col gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 hover:border-destructive/30 transition-all duration-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </div>
            <h4 className="text-[10px] font-medium text-destructive uppercase tracking-wider">Excepción</h4>
          </div>
          {motivoExcepcion && (
            <p className="text-sm bg-background/50 p-2.5 rounded-md border border-destructive/10 text-destructive/90 font-medium">{motivoExcepcion}</p>
          )}
        </div>
      )}
      
      {bultoModification && (
        <BultoModificationInfo 
          original={bultoModification.original}
          entregados={bultoModification.entregados}
          note={bultoModification.note}
        />
      )}
      
      <div className={`grid ${gridCols} gap-3 mt-4`}>

        {hasFirma && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.25 }}
            className="group flex flex-col gap-3 p-3 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
                <PenLine className="h-3.5 w-3.5 text-royal-blue" />
              </div>
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Firma</h4>
            </div>
            <div className="flex justify-center items-center overflow-hidden h-24 w-full bg-background/50 rounded-md border border-border/30">
              <SignatureDisplay signatureData={firma} width="100%" height={80} />
            </div>
          </motion.div>
        )}
        
        {hasImagen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            className="group flex flex-col gap-3 p-3 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
                <ImageIcon className="h-3.5 w-3.5 text-royal-blue" />
              </div>
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Evidencia</h4>
            </div>
            <div className="relative group/img w-full flex justify-center items-center h-24 bg-background/50 rounded-md border border-border/30 p-1">
              <LazyImageDisplay 
                imageUrl={imagen || undefined}
                alt="Evidencia de entrega"
                className="max-h-full object-contain rounded-md"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1 right-1 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 shadow-lg backdrop-blur-sm h-6 w-6"
                onClick={() => setShowImageModal(true)}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <ImageDisplayModal 
        open={showImageModal}
        onOpenChange={setShowImageModal}
        imageUrl={imagen || ''}
        fileName="evidencia-entrega"
      />
    </div>
  );
};
