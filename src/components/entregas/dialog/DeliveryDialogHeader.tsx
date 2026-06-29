
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PackageCheck } from 'lucide-react';

export const DeliveryDialogHeader = () => {
  return (
    <DialogHeader className="relative overflow-hidden -mx-6 -mt-6 px-6 pt-6 pb-5 mb-5 border-b border-royal-gray/30 rounded-t-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-royal-blue/10 via-royal-blue/5 to-transparent pointer-events-none" />
      <div className="relative flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-royal-blue to-[#112d5e] shadow-md shadow-royal-blue/20">
          <PackageCheck className="h-6 w-6 text-royal-yellow" />
        </div>
        <div className="flex flex-col text-left">
          <DialogTitle className="text-xl font-bold text-royal-blue tracking-tight">
            Confirmar Entrega
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-0.5">
            Registre la entrega del conduce al cliente
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
};
