
import { ClientInfo } from './ClientInfo';
import { LocationSection } from './LocationSection';
import { DeliveryFormSection } from './DeliveryFormSection';
import { RequiredFormNotice } from './RequiredFormNotice';
import { Conduce } from '@/types/conduces';
import { Separator } from '@/components/ui/separator';

interface DeliveryDialogContentProps {
  conduce: Conduce | null;
  additionalConduces: Conduce[];
  coordinates: {latitude: number, longitude: number} | null;
  hasStoredLocation: boolean;
  storedLocation?: string;
  clienteDireccion?: string;
  deliveryNote: string;
  onNoteChange: (note: string) => void;
  onSignatureCapture: (signature: string) => void;
  onImageCapture: (image: string) => void;
  imageData: string;
  isFormValid: boolean;
  isSubmitting: boolean;
  onSaveLocation: () => Promise<void>;
}

export const DeliveryDialogContent = ({
  conduce,
  additionalConduces,
  coordinates,
  hasStoredLocation,
  storedLocation,
  clienteDireccion,
  deliveryNote,
  onNoteChange,
  onSignatureCapture,
  onImageCapture,
  imageData,
  isFormValid,
  isSubmitting,
  onSaveLocation
}: DeliveryDialogContentProps) => {
  if (!conduce) return null;
  
  return (
    <div className="space-y-6 py-2">
      <div className="p-4 rounded-2xl bg-royal-light border border-royal-gray shadow-sm">
        <ClientInfo conduce={conduce} additionalConduces={additionalConduces} />
      </div>
      
      <Separator className="bg-border/60" />
      
      <LocationSection
        coordinates={coordinates}
        hasStoredLocation={hasStoredLocation}
        storedLocation={storedLocation}
        clienteDireccion={clienteDireccion}
        onSaveLocation={onSaveLocation}
      />
      
      <Separator className="bg-border/60" />
      
      <DeliveryFormSection
        deliveryNote={deliveryNote}
        onNoteChange={onNoteChange}
        onSignatureCapture={onSignatureCapture}
        onImageCapture={onImageCapture}
        imageData={imageData}
      />
      
      <RequiredFormNotice 
        isFormValid={isFormValid}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
