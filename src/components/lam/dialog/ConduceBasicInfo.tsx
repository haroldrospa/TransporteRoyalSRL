import { Label } from '@/components/ui/label';
import { MapPin, User, Calendar, Building, Hash, Package2, Clock, FlaskConical } from 'lucide-react';
import { formatReadableDate } from '@/utils/dateFormatters';
import { formatDeliveryTime } from '@/utils/lamUtils';
import { motion } from 'framer-motion';
import BultoModificationSection from './BultoModificationSection';
import { DeliveryTimeField } from './form/DeliveryTimeField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { isAdministrator } from '@/utils/userPermissions';

const LABORATORIOS = ['Fersuaz', 'Taapharmaceutica', 'Innovacion Quimica', 'LAM'];

interface ConduceBasicInfoProps {
  numeroFactura: string;
  numeroCliente: string;
  razonSocial?: string | null;
  ciudad?: string | null;
  encomendado?: string | null;
  fechaEntrega: string;
  horaEntregaExacta?: string | null;
  estado: string;
  laboratorio: string;
  tiempoEntrega?: string;
  cantidadBultos: number;
  editMode?: boolean;
  cantidadEntregados?: number;
  bultoModificacionNota?: string;
  onBultosChange?: (value: number, note: string) => void;
  editTiempoEntrega?: string;
  onTimeChange?: (val: string) => void;
  editLaboratorio?: string;
  onLaboratorioChange?: (val: string) => void;
}

export const ConduceBasicInfo = ({
  numeroFactura,
  numeroCliente,
  razonSocial,
  ciudad,
  encomendado,
  fechaEntrega,
  horaEntregaExacta,
  estado,
  laboratorio,
  tiempoEntrega,
  cantidadBultos,
  editMode = false,
  cantidadEntregados,
  bultoModificacionNota,
  onBultosChange,
  editTiempoEntrega,
  onTimeChange,
  editLaboratorio,
  onLaboratorioChange
}: ConduceBasicInfoProps) => {
  const { user } = useAuth();
  const isAdmin = isAdministrator(user);

  const fechaMostrar = estado === 'Entregado' && horaEntregaExacta 
    ? formatReadableDate(horaEntregaExacta.split(' ')[0])
    : formatReadableDate(fechaEntrega);

  const tiempoMostrar = tiempoEntrega ? formatDeliveryTime(tiempoEntrega) : 'No registrado';

  const infoItems = [
    { icon: Hash, label: 'Factura', value: numeroFactura },
    { icon: User, label: 'Cliente', value: numeroCliente },
    { icon: Building, label: 'Razón Social', value: razonSocial || '-' },
    { icon: MapPin, label: 'Ciudad', value: ciudad || '-' },
    { icon: User, label: 'Asignado a', value: encomendado || '-' },
    { icon: Calendar, label: 'Fecha de Entrega', value: fechaMostrar },
  ];

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
        <Package2 className="h-4 w-4 text-royal-blue" />
        Información General
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.25, ease: 'easeOut' }}
            className="group flex items-center gap-2.5 p-2.5 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
              <item.icon className="h-3.5 w-3.5 text-royal-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</Label>
              <div className="text-sm font-semibold text-foreground truncate">{item.value}</div>
            </div>
          </motion.div>
        ))}

        {!editMode ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * infoItems.length, duration: 0.25, ease: 'easeOut' }}
            className="group flex items-center gap-2.5 p-2.5 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
              <FlaskConical className="h-3.5 w-3.5 text-royal-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Laboratorio</Label>
              <div className="text-sm font-semibold text-foreground truncate">{laboratorio || '-'}</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * infoItems.length, duration: 0.25, ease: 'easeOut' }}
            className="group flex flex-col p-3 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
             <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
                 <FlaskConical className="h-3.5 w-3.5 text-royal-blue" />
               </div>
               <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Editar Laboratorio</Label>
             </div>
             <Select value={editLaboratorio || laboratorio} onValueChange={onLaboratorioChange} disabled={!isAdmin}>
                <SelectTrigger className={`h-8 text-xs ${!isAdmin ? "opacity-80 cursor-not-allowed bg-muted" : ""}`}>
                  <SelectValue placeholder="Seleccionar laboratorio" />
                </SelectTrigger>
                <SelectContent>
                  {LABORATORIOS.map(lab => (
                    <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                  ))}
                </SelectContent>
             </Select>
             {!isAdmin && (
               <p className="text-[9px] text-muted-foreground italic mt-1">
                 * Solo el administrador puede cambiar el laboratorio.
               </p>
             )}
          </motion.div>
        )}

        {!editMode ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * infoItems.length, duration: 0.25, ease: 'easeOut' }}
            className="group flex items-center gap-2.5 p-2.5 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
              <Clock className="h-3.5 w-3.5 text-royal-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tiempo de Entrega</Label>
              <div className="text-sm font-semibold text-foreground truncate">{tiempoMostrar}</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * infoItems.length, duration: 0.25, ease: 'easeOut' }}
            className="group flex flex-col p-3 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
             <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
                 <Clock className="h-3.5 w-3.5 text-royal-blue" />
               </div>
               <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Editar Tiempo</Label>
             </div>
             <DeliveryTimeField 
                value={editTiempoEntrega || ''} 
                onChange={onTimeChange || (() => {})} 
             />
          </motion.div>
        )}


        {!editMode ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * infoItems.length, duration: 0.25, ease: 'easeOut' }}
            className="group flex items-center gap-2.5 p-2.5 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
              <Package2 className="h-3.5 w-3.5 text-royal-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cantidad Bultos</Label>
              <div className="text-sm font-semibold text-foreground truncate">{cantidadBultos.toString()}</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * infoItems.length, duration: 0.25, ease: 'easeOut' }}
            className="group flex flex-col p-3 rounded-lg bg-royal-blue/[0.03] border border-royal-blue/10 hover:border-royal-blue/20 transition-all duration-200"
          >
             <div className="flex items-center gap-2 mb-3">
               <div className="p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20">
                 <Package2 className="h-3.5 w-3.5 text-royal-blue" />
               </div>
               <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Editar Cantidad Bultos</Label>
             </div>
             <BultoModificationSection
              cantidadBultos={cantidadBultos}
              cantidadEntregados={cantidadEntregados}
              onBultosChange={onBultosChange || (() => {})}
             />
          </motion.div>
        )}
      </div>
    </div>
  );
};
