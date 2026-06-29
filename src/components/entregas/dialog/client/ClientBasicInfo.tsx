
import { Conduce } from '@/types/conduces';
import { FileText, User, Building2 } from 'lucide-react';

interface ClientBasicInfoProps {
  conduce: Conduce;
}

export const ClientBasicInfo = ({ conduce }: ClientBasicInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Conduce Card */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-royal-gray/80 shadow-sm">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-royal-blue/5 text-royal-blue shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Conduce</span>
            <span className="text-lg font-black text-royal-blue leading-tight tabular-nums">{conduce.numeroConduce}</span>
          </div>
        </div>

        {/* Cliente Card */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-royal-gray/80 shadow-sm">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-royal-blue/5 text-royal-blue shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cliente</span>
            <span className="text-lg font-black text-royal-blue leading-tight tabular-nums">{conduce.numeroCliente}</span>
          </div>
        </div>
      </div>
      
      {/* Razón Social Card */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-royal-gray/80 shadow-sm">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-royal-blue/5 text-royal-blue shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Razón Social</span>
          <span className="text-base font-bold text-foreground leading-tight">{conduce.razonSocial || 'No especificada'}</span>
        </div>
      </div>
    </div>
  );
};
