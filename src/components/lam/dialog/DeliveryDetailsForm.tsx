
import { DeliveryNoteField } from './form/DeliveryNoteField';
import { ExceptionToggle } from './form/ExceptionToggle';
import { ExceptionNoteField } from './form/ExceptionNoteField';
import { SignatureField } from './form/SignatureField';
import { ImageField } from './form/ImageField';
import { motion } from 'framer-motion';
import { Edit3, MessageSquare, AlertTriangle, PenLine, ImageIcon } from 'lucide-react';
export interface EditDataType {
  tiempoEntrega: string;
  nota: string;
  excepcion: boolean;
  motivoExcepcion: string;
  cantidadEntregados?: number;
  bultoModificacionNota?: string;
}

interface DeliveryDetailsFormProps {
  editData: EditDataType;
  setEditData: (data: EditDataType) => void;
  signatureData: string;
  setSignatureData: (data: string) => void;
  imageData: string;
  setImageData: (data: string) => void;
  initialImage?: string;
}

export const DeliveryDetailsForm = ({
  editData,
  setEditData,
  signatureData,
  setSignatureData,
  imageData,
  setImageData,
  initialImage
}: DeliveryDetailsFormProps) => {
  const handleTimeChange = (tiempoEntrega: string) => {
    setEditData({...editData, tiempoEntrega});
  };
  
  const handleNoteChange = (nota: string) => {
    setEditData({...editData, nota});
  };
  
  const handleExceptionToggle = (excepcion: boolean) => {
    setEditData({...editData, excepcion});
  };
  
  const handleExceptionNoteChange = (motivoExcepcion: string) => {
    setEditData({...editData, motivoExcepcion});
  };
  
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4 shadow-sm mt-4">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
        <Edit3 className="h-4 w-4 text-royal-blue" />
        Editar Detalles de Entrega
      </h3>

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
        <DeliveryNoteField 
          value={editData.nota} 
          onChange={handleNoteChange} 
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`group flex flex-col gap-2 p-3 rounded-lg border transition-all duration-200 ${
          editData.excepcion 
            ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/30' 
            : 'bg-muted/30 border-border/50 hover:border-border/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${editData.excepcion ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted border border-border/50'}`}>
              <AlertTriangle className={`h-3.5 w-3.5 ${editData.excepcion ? 'text-destructive' : 'text-muted-foreground'}`} />
            </div>
            <h4 className={`text-[10px] font-medium uppercase tracking-wider ${editData.excepcion ? 'text-destructive' : 'text-muted-foreground'}`}>Excepción</h4>
          </div>
          <ExceptionToggle 
            checked={editData.excepcion} 
            onCheckedChange={handleExceptionToggle} 
          />
        </div>
        <ExceptionNoteField 
          value={editData.motivoExcepcion} 
          onChange={handleExceptionNoteChange}
          show={editData.excepcion}
        />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">        <motion.div
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
          <SignatureField 
            signatureData={signatureData}
            setSignatureData={setSignatureData}
            initialSignature={signatureData}
          />
        </motion.div>

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
          <ImageField 
            imageData={imageData}
            setImageData={setImageData}
            initialImage={initialImage}
          />
        </motion.div>
      </div>
    </div>
  );
};
