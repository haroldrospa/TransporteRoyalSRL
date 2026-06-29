
import { ConduceBasicInfo } from './ConduceBasicInfo';
import { DeliveryTimeDisplay } from './DeliveryTimeDisplay';
import { DeliveryDetailsForm, EditDataType } from './DeliveryDetailsForm';
import { DeliveryReadOnlyDetails } from './DeliveryReadOnlyDetails';
import { ReturnDetailsInfo } from './ReturnDetailsInfo';
import BultoModificationSection from './BultoModificationSection';
import { Conduce } from '@/types/conduces';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConduceDetailsDialogContentProps {
  conduce: Conduce;
  editMode: boolean;
  editData: EditDataType;
  signatureData: string;
  imageData: string;
  parseDeliveryTime: (timeStr: string) => number;
  onSetEditData: (data: EditDataType) => void;
  onBultosChange: (value: number, note: string) => void;
  setSignatureData: (data: string) => void;
  setImageData: (data: string) => void;
}

export const ConduceDetailsDialogContent = ({
  conduce,
  editMode,
  editData,
  signatureData,
  imageData,
  parseDeliveryTime,
  onSetEditData,
  onBultosChange,
  setSignatureData,
  setImageData
}: ConduceDetailsDialogContentProps) => {
  const hasBultoModification = 
    conduce.cantidadEntregados !== undefined && 
    conduce.cantidadEntregados !== conduce.cantidadBultos;
  
  return (
    <div className="p-5 space-y-4">
      <ConduceBasicInfo
        numeroFactura={conduce.numeroFactura}
        numeroCliente={conduce.numeroCliente}
        razonSocial={conduce.razonSocial}
        ciudad={conduce.ciudad}
        encomendado={conduce.encomendado}
        fechaEntrega={conduce.fechaEntrega}
        horaEntregaExacta={conduce.horaEntregaExacta}
        estado={conduce.estado}
        laboratorio={conduce.laboratorio}
        cantidadBultos={conduce.cantidadBultos}
        tiempoEntrega={conduce.tiempoEntrega}
        editMode={editMode}
        cantidadEntregados={conduce.cantidadEntregados}
        bultoModificacionNota={conduce.bultoModificacionNota}
        onBultosChange={onBultosChange}
        editTiempoEntrega={editData.tiempoEntrega}
        onTimeChange={(val) => onSetEditData({...editData, tiempoEntrega: val})}
      />

      {conduce.estado === 'Devuelto' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25 }}
        >
          <ReturnDetailsInfo
            cantidadBultos={conduce.cantidadBultos}
            cantidadEntregados={conduce.cantidadEntregados}
            motivoDevolucion={conduce.motivoExcepcion}
            nota={conduce.nota}
          />
        </motion.div>
      )}

      {!editMode ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="w-full"
        >
          <DeliveryReadOnlyDetails
            nota={conduce.nota}
            excepcion={conduce.excepcion}
            motivoExcepcion={conduce.motivoExcepcion}
            firma={conduce.firma}
            imagen={imageData || conduce.imagen}
            bultoModification={hasBultoModification ? {
              original: conduce.cantidadBultos,
              entregados: conduce.cantidadEntregados || conduce.cantidadBultos,
              note: conduce.bultoModificacionNota || ''
            } : undefined}
            tiempoEntrega={conduce.tiempoEntrega}
            parseDeliveryTime={parseDeliveryTime}
            numeroCliente={conduce.numeroCliente}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <DeliveryDetailsForm
            editData={editData}
            setEditData={onSetEditData}
            signatureData={signatureData}
            setSignatureData={setSignatureData}
            imageData={imageData}
            setImageData={setImageData}
            initialImage={conduce.imagen || undefined}
          />
        </motion.div>
      )}
    </div>
  );
};
