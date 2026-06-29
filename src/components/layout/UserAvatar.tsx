import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { User } from '@/contexts/AuthContext';
import { Settings, User as UserIcon, Shield } from 'lucide-react';
import { 
  getManualConduceEnabled, 
  getExcelUploadEnabled, 
  setManualConduceEnabled, 
  setExcelUploadEnabled 
} from '@/utils/userSettings';
import { toast } from '@/hooks/use-toast';

interface UserAvatarProps {
  user: User;
}

const UserAvatar = ({ user }: UserAvatarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualEnabled, setManualEnabled] = useState(() => getManualConduceEnabled(user.id));
  const [excelEnabled, setExcelEnabled] = useState(() => getExcelUploadEnabled(user.id, user.laboratorio));

  const handleToggleManual = (checked: boolean) => {
    setManualEnabled(checked);
    setManualConduceEnabled(user.id, checked);
    toast({
      title: "Configuración de usuario",
      description: `Creación manual de conduces ${checked ? 'habilitada' : 'inhabilitada'}`,
    });
  };

  const handleToggleExcel = (checked: boolean) => {
    setExcelEnabled(checked);
    setExcelUploadEnabled(user.id, checked);
    toast({
      title: "Configuración de usuario",
      description: `Carga de archivo Excel ${checked ? 'habilitada' : 'inhabilitada'}`,
    });
  };

  // Determine if settings toggles should be shown
  const isLabUser = user.puesto === 'Laboratorio' || user.puesto === 'LAM' || user.nivel === 6;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Avatar className="h-8 w-8 bg-royal-yellow text-royal-blue border border-royal-yellow/20">
                <AvatarFallback className="font-semibold text-royal-blue bg-royal-yellow">
                  {user.nombre[0] && user.apellido[0] ? `${user.nombre[0]}${user.apellido[0]}` : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-sm text-left">
                <p className="font-medium text-white">{`${user.nombre} ${user.apellido}`}</p>
                <p className="text-xs text-white/75">{user.puesto}</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Perfil y Configuración</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-royal-blue" />
              Perfil de Usuario
            </DialogTitle>
            <DialogDescription>
              Información de cuenta y configuración de interfaz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User Details Card */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border/55">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-semibold text-foreground">{user.nombre} {user.apellido}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Puesto / Rol:</span>
                <span className="font-semibold text-royal-blue">{user.puesto}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Nivel de acceso:</span>
                <span className="flex items-center font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-green-500 mr-1" />
                  Nivel {user.nivel}
                </span>
              </div>
              {user.laboratorio && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Laboratorio:</span>
                  <span className="font-semibold text-foreground">{user.laboratorio}</span>
                </div>
              )}
              {user.camion && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Camión Asignado:</span>
                  <span className="font-semibold text-foreground">{user.camion}</span>
                </div>
              )}
            </div>

            {/* Interface settings (shown only for lab users) */}
            {isLabUser && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-1.5 border-b pb-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">Preferencias del Laboratorio</h3>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-0.5 pr-4 text-left">
                      <span className="text-sm font-medium">Botón "Crear Conduces"</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Habilita la creación manual de conduces.
                      </span>
                    </div>
                    <Switch
                      checked={manualEnabled}
                      onCheckedChange={handleToggleManual}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-0.5 pr-4 text-left">
                      <span className="text-sm font-medium">Botón "Cargar Archivo" (Excel)</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Habilita la importación de archivos Excel.
                      </span>
                    </div>
                    <Switch
                      checked={excelEnabled}
                      onCheckedChange={handleToggleExcel}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserAvatar;
