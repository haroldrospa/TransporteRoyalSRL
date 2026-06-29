
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, PenTool, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import SignatureCanvas from '@/components/SignatureCanvas';
import ImageUploader from '@/components/ImageUploader';

interface DeliveryFormSectionProps {
  deliveryNote: string;
  onNoteChange: (note: string) => void;
  onSignatureCapture: (signature: string) => void;
  onImageCapture: (image: string) => void;
  imageData: string;
}

export const DeliveryFormSection = ({
  deliveryNote,
  onNoteChange,
  onSignatureCapture,
  onImageCapture,
  imageData
}: DeliveryFormSectionProps) => {
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Firma */}
      <div className="space-y-3">
        <button 
          type="button"
          onClick={() => setIsSignatureOpen(!isSignatureOpen)}
          className="w-full flex items-center justify-between focus:outline-none group"
        >
          <h4 className="text-sm font-bold text-royal-blue flex items-center gap-2">
            <PenTool className="h-4 w-4 text-royal-gold" />
            Firma de recepción 
            <span className="text-xs font-normal text-muted-foreground ml-1">(Opcional)</span>
          </h4>
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-royal-light group-hover:bg-royal-yellow/20 transition-colors">
            {isSignatureOpen ? (
              <ChevronUp className="h-4 w-4 text-royal-blue" />
            ) : (
              <ChevronDown className="h-4 w-4 text-royal-blue" />
            )}
          </div>
        </button>
        {isSignatureOpen && (
          <div className="rounded-xl border-2 border-dashed border-royal-gray overflow-hidden hover:border-royal-blue/40 transition-colors bg-royal-light/50 animate-in slide-in-from-top-2 fade-in duration-200">
            <SignatureCanvas onSignatureCapture={onSignatureCapture} />
          </div>
        )}
      </div>
      
      {/* Foto */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-royal-blue flex items-center gap-2">
            <Camera className="h-4 w-4 text-royal-gold" />
            Foto de entrega
          </h4>
          {!imageData && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Requerido
            </span>
          )}
        </div>
        <div className="rounded-xl border-2 border-dashed border-royal-gray overflow-hidden hover:border-royal-blue/40 transition-colors bg-royal-light/50">
          <ImageUploader onImageCapture={onImageCapture} />
        </div>
      </div>
      
      {/* Nota */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-royal-blue flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-royal-gold" />
          Nota de entrega
          <span className="text-xs font-normal text-muted-foreground ml-1">(Opcional)</span>
        </h4>
        <Textarea
          id="note"
          placeholder="Agregar observaciones o comentarios..."
          value={deliveryNote}
          onChange={(e) => onNoteChange(e.target.value)}
          className="rounded-xl resize-none min-h-[80px] border-royal-gray focus:border-royal-blue focus:ring-royal-blue/20 bg-white"
        />
      </div>
    </div>
  );
};
