
import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/contexts/AuthContext';
import Logo from './Logo';

interface MobileMenuProps {
  user: User;
  navLinks: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
}

const MobileMenu = ({
  user,
  navLinks,
  isOpen,
  setIsOpen,
  onLogout
}: MobileMenuProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-royal-blue text-white w-[80%] p-0">
        <div className="flex flex-col h-[100dvh]">
          <div className="p-4 border-b border-royal-blue/30 flex items-center justify-between">
            <Logo />
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 py-2">
            <div className="px-2 pb-4 border-b border-royal-blue/30">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10 bg-royal-yellow text-royal-blue">
                  <AvatarFallback>{`${user.nombre[0]}${user.apellido[0]}`}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{`${user.nombre} ${user.apellido}`}</p>
                  <p className="text-xs opacity-75">{user.puesto}</p>
                </div>
              </div>
            </div>
            
            <nav className="mt-4 flex flex-col gap-6 px-4 pb-6">
              {/* Dashboard */}
              {navLinks.filter(link => link.to === '/').length > 0 && (
                <div className="flex flex-col gap-1 w-full">
                  {navLinks.filter(link => link.to === '/').map(link => {
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.to} 
                        to={link.to} 
                        className="flex items-center justify-start gap-3 p-3 rounded-md text-white hover:bg-white/10 transition-colors font-medium w-full text-left" 
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Laboratorios */}
              {navLinks.filter(link => ['/lam', '/fersuaz', '/taapharmaceutica', '/innovacion-quimica'].includes(link.to)).length > 0 && (
                <div className="flex flex-col gap-1 w-full">
                  <h3 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 text-left">Laboratorios</h3>
                  {navLinks.filter(link => ['/lam', '/fersuaz', '/taapharmaceutica', '/innovacion-quimica'].includes(link.to)).map(link => {
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.to} 
                        to={link.to} 
                        className="flex items-center justify-start gap-3 p-3 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors w-full text-left" 
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Operaciones */}
              {navLinks.filter(link => ['/entregas', '/control-bultos', '/cargar-camiones', '/control-conduces'].includes(link.to)).length > 0 && (
                <div className="flex flex-col gap-1 w-full">
                  <h3 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 text-left">Operaciones</h3>
                  {navLinks.filter(link => ['/entregas', '/control-bultos', '/cargar-camiones', '/control-conduces'].includes(link.to)).map(link => {
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.to} 
                        to={link.to} 
                        className="flex items-center justify-start gap-3 p-3 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors w-full text-left" 
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Administración */}
              {navLinks.filter(link => ['/clientes', '/usuarios', '/choferes-dashboard', '/admin-config'].includes(link.to)).length > 0 && (
                <div className="flex flex-col gap-1 w-full">
                  <h3 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 text-left">Administración</h3>
                  {navLinks.filter(link => ['/clientes', '/usuarios', '/choferes-dashboard', '/admin-config'].includes(link.to)).map(link => {
                    const Icon = link.icon;
                    return (
                      <Link 
                        key={link.to} 
                        to={link.to} 
                        className="flex items-center justify-start gap-3 p-3 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors w-full text-left" 
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </nav>
          </div>
          
          <div className="p-4 border-t border-royal-blue/30 bg-transparent">
            <Button 
              variant="default" 
              onClick={onLogout} 
              className="w-full bg-royal-yellow text-black hover:bg-yellow-500 font-medium"
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Create a small component for the LogOut icon to avoid importing the whole lucide-react library in this file
const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default MobileMenu;
