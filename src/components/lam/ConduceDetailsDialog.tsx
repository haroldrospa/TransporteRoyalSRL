
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Conduce } from '@/types/conduces';
import { useConduceDetailsDialog } from '@/hooks/lam/useConduceDetailsDialog';
import { ConduceDetailsDialogHeader } from './dialog/ConduceDetailsDialogHeader';
import { ConduceDetailsDialogContent } from './dialog/ConduceDetailsDialogContent';
import { ConduceDetailsDialogFooter } from './dialog/ConduceDetailsDialogFooter';
import { motion, AnimatePresence } from 'framer-motion';

interface ConduceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConduce: Conduce | null;
  onSaveChanges: (
    updates: {
      tiempoEntrega: string;
      nota: string;
      excepcion: boolean;
      motivoExcepcion: string | null;
      firma: string;
      imagen: string;
      cantidadEntregados?: number;
      bultoModificacionNota?: string;
      bultoModificado?: boolean;
    }
  ) => Promise<void>;
  userNivel: number | undefined;
  parseDeliveryTime: (timeStr: string) => number;
  loadConduceImage?: (conduceId: string) => Promise<string | null>;
}

const ConduceDetailsDialog = ({
  open,
  onOpenChange,
  selectedConduce,
  onSaveChanges,
  userNivel,
  parseDeliveryTime,
  loadConduceImage
}: ConduceDetailsDialogProps) => {
  const {
    editMode,
    editData,
    isSubmitting,
    signatureData,
    imageData,
    setEditMode,
    handleBultosChange,
    handleSetEditData,
    handleSaveChanges,
    setSignatureData,
    setImageData
  } = useConduceDetailsDialog({
    selectedConduce,
    onSaveChanges,
    loadConduceImage
  });

  if (!selectedConduce) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-b from-background to-muted/20">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
              >
                <ConduceDetailsDialogHeader
                  conduce={selectedConduce}
                  parseDeliveryTime={parseDeliveryTime}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3, ease: 'easeOut' }}
              >
                <ConduceDetailsDialogContent
                  conduce={selectedConduce}
                  editMode={editMode}
                  editData={editData}
                  signatureData={signatureData}
                  imageData={imageData}
                  parseDeliveryTime={parseDeliveryTime}
                  onSetEditData={handleSetEditData}
                  onBultosChange={handleBultosChange}
                  setSignatureData={setSignatureData}
                  setImageData={setImageData}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.25, ease: 'easeOut' }}
              >
                <ConduceDetailsDialogFooter
                  editMode={editMode}
                  isSubmitting={isSubmitting}
                  userCanEdit={userNivel !== undefined && (userNivel >= 4 || (userNivel === 2 && selectedConduce.estado === 'Pendiente'))}
                  onEditClick={() => setEditMode(true)}
                  onCancelEdit={() => setEditMode(false)}
                  onSaveChanges={handleSaveChanges}
                  conduce={selectedConduce}
                  imageData={imageData}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ConduceDetailsDialog;
