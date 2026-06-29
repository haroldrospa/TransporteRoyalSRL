
import { Conduce } from '@/types/conduces';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DeliveryDialogHeader } from './dialog/DeliveryDialogHeader';
import { DeliveryDialogContent } from './dialog/DeliveryDialogContent';
import { DeliveryDialogFooter } from './dialog/DeliveryDialogFooter';
import { UploadProgressOverlay } from './dialog/UploadProgressOverlay';
import { useDeliveryDialog } from './hooks/useDeliveryDialog';
import { motion, AnimatePresence } from 'framer-motion';

interface DeliveryDialogProps {
  conduce: Conduce | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (signature: string, note: string, image: string) => Promise<void>;
  onSaveLocation: (numeroCliente: string, coordinates?: { latitude: number; longitude: number }) => Promise<void>;
  openGoogleMaps: (ubicacion: string | undefined) => void;
  isSubmitting: boolean;
  savingLocation: boolean;
  additionalConduces?: Conduce[];
}

export const DeliveryDialog = ({
  conduce,
  open,
  onOpenChange,
  onSubmit,
  onSaveLocation,
  openGoogleMaps,
  isSubmitting,
  savingLocation,
  additionalConduces = []
}: DeliveryDialogProps) => {
  const {
    deliveryNote,
    setDeliveryNote,
    signatureData,
    setSignatureData,
    imageData,
    setImageData,
    coordinates,
    uploadProgress,
    backgroundUpload,
    cliente,
    hasStoredLocation,
    isFormValid,
    handleSaveLocation,
    handleSubmitDelivery,
    handleBackgroundSubmit,
    handleOpenChange
  } = useDeliveryDialog(conduce, onOpenChange, onSubmit, onSaveLocation, isSubmitting);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-2xl bg-card border-0 rounded-2xl shadow-2xl ring-1 ring-border/50 p-0"
        onPointerDownOutside={e => {
          if (isSubmitting && !backgroundUpload) {
            e.preventDefault();
          }
        }} 
        onEscapeKeyDown={e => {
          if (isSubmitting && !backgroundUpload) {
            e.preventDefault();
          }
        }}
      >
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 space-y-0"
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <DeliveryDialogHeader />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.35 }}
              >
                <DeliveryDialogContent
                  conduce={conduce}
                  additionalConduces={additionalConduces}
                  coordinates={coordinates}
                  hasStoredLocation={hasStoredLocation}
                  storedLocation={cliente?.ubicacion}
                  deliveryNote={deliveryNote}
                  onNoteChange={setDeliveryNote}
                  onSignatureCapture={setSignatureData}
                  onImageCapture={setImageData}
                  imageData={imageData}
                  isFormValid={isFormValid}
                  isSubmitting={isSubmitting}
                  onSaveLocation={handleSaveLocation}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <DeliveryDialogFooter
                  isSubmitting={isSubmitting}
                  isFormValid={isFormValid}
                  backgroundUpload={backgroundUpload}
                  onSubmit={handleSubmitDelivery}
                  onBackgroundSubmit={handleBackgroundSubmit}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <UploadProgressOverlay
          isSubmitting={isSubmitting}
          backgroundUpload={backgroundUpload}
          uploadProgress={uploadProgress}
        />
      </DialogContent>
    </Dialog>
  );
};
