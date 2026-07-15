import { RefreshCcw, Camera, ChevronDown, ChevronUp, Package, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FontSizeControl } from '@/components/layout/FontSizeControl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface EntregasHeaderProps {
  regionActual: string;
  onRefresh: () => void;
  onAutoDelivery: () => void;
  onEntregaLAM: () => void;
  loading: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isAdmin?: boolean;
  onRegionChange?: (region: string) => void;
}

export const EntregasHeader = ({ 
  regionActual, 
  onRefresh, 
  onAutoDelivery,
  onEntregaLAM,
  loading,
  isCollapsed = false,
  onToggleCollapse,
  isAdmin = false,
  onRegionChange
}: EntregasHeaderProps) => {
  return (
    <div className="flex flex-col gap-3 md:gap-5 bg-card p-3 md:p-5 rounded-xl md:rounded-2xl border shadow-sm">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Title Area */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex p-3 bg-primary/5 border border-primary/10 rounded-xl">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground">
                Entregas
              </h1>
              {isAdmin && onRegionChange ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-[10px] md:text-xs font-semibold tracking-wide uppercase cursor-pointer">
                      {regionActual}
                      <ChevronDown className="h-3 w-3" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onRegionChange('Norte')}>NORTE</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRegionChange('Sur')}>SUR</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRegionChange('Este')}>ESTE</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-semibold tracking-wide uppercase">
                  {regionActual}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <p className="hidden md:block text-muted-foreground text-sm mt-1">
                Sistema de gestión de logística y paquetería
              </p>
            )}
          </div>
        </div>

        {/* Controls Area */}
        <div className="flex items-center gap-1 md:gap-2">
          <FontSizeControl />
          
          {/* Menú Móvil */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onAutoDelivery} className="flex items-center gap-2 py-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <span>Por Imagen</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEntregaLAM} className="flex items-center gap-2 py-2">
                  <Package className="h-4 w-4 text-secondary-foreground" />
                  <span>Entrega LAM</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onRefresh} disabled={loading} className="flex items-center gap-2 py-2">
                  <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {onToggleCollapse && (
            <Button
              onClick={onToggleCollapse}
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isCollapsed && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-2 border-t border-border/50">
          <Button
            onClick={onAutoDelivery}
            className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-9 md:h-10 px-3 md:px-5 rounded-xl text-xs md:text-sm flex-1 md:flex-none"
          >
            <Camera className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Por Imagen
          </Button>

          <Button
            onClick={onEntregaLAM}
            variant="secondary"
            className="shadow-sm h-9 md:h-10 px-3 md:px-5 rounded-xl bg-secondary/60 hover:bg-secondary/80 text-xs md:text-sm flex-1 md:flex-none"
          >
            <Package className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            Entrega LAM
          </Button>
          
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            className="shadow-sm h-9 md:h-10 px-3 md:px-5 rounded-xl bg-background text-xs md:text-sm flex-none"
          >
            <RefreshCcw className={`h-3.5 w-3.5 md:h-4 md:w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      )}
    </div>
  );
};
