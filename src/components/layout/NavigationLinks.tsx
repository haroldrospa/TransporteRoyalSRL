import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Package, Truck, FileText, Users, Building, CheckSquare, FlaskConical, Pill, Beaker, ChevronDown, Activity, ShieldAlert, Settings } from 'lucide-react';
import { User } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationLinksProps {
  links?: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  mobile?: boolean;
}

export const getNavLinks = (user: User | null) => {
  const baseLinks = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/lam', label: 'LAM', icon: FileText },
    { to: '/fersuaz', label: 'Fersuaz', icon: FlaskConical },
    { to: '/taapharmaceutica', label: 'Taapharma', icon: Pill },
    { to: '/innovacion-quimica', label: 'Innov. Quimica', icon: Beaker },
    { to: '/entregas', label: 'Entregas', icon: Package },
    { to: '/control-bultos', label: 'Control Bultos', icon: Package },
    { to: '/cargar-camiones', label: 'Cargar Camiones', icon: Truck },
    { to: '/control-conduces', label: 'Control Conduces', icon: CheckSquare },
    { to: '/clientes', label: 'Clientes', icon: Building },
    { to: '/usuarios', label: 'Usuarios', icon: Users },
  ];

  if (user?.puesto === 'Chofer') {
    return baseLinks.filter(link => ['/entregas'].includes(link.to));
  }

  if (user?.puesto === 'Despachador') {
    return baseLinks.filter(link => link.to === '/cargar-camiones');
  }

  if (user?.nivel === 1) {
    return baseLinks;
  }

  if (user?.nivel === 2) {
    if (user?.laboratorio === 'LAM') {
      return baseLinks.filter(link => ['/', '/lam'].includes(link.to));
    }
    if (user?.laboratorio === 'Fersuaz') {
      return baseLinks.filter(link => ['/', '/fersuaz'].includes(link.to));
    }
    if (user?.laboratorio === 'Taapharmaceutica') {
      return baseLinks.filter(link => ['/', '/taapharmaceutica'].includes(link.to));
    }
    if (user?.laboratorio === 'Innovacion Quimica') {
      return baseLinks.filter(link => ['/', '/innovacion-quimica'].includes(link.to));
    }
    return baseLinks.filter(link => ['/', '/lam', '/fersuaz', '/taapharmaceutica', '/innovacion-quimica'].includes(link.to));
  }

  if (user?.nivel === 6) {
    return baseLinks.filter(link => ['/lam', '/fersuaz', '/taapharmaceutica', '/innovacion-quimica', '/entregas'].includes(link.to));
  }

  return baseLinks;
};

const NavigationLinks = ({ links, mobile = false }: NavigationLinksProps) => {
  const location = useLocation();
  
  const defaultLinks = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/lam', label: 'LAM', icon: FileText },
    { to: '/fersuaz', label: 'Fersuaz', icon: FlaskConical },
    { to: '/taapharmaceutica', label: 'Taapharma', icon: Pill },
    { to: '/innovacion-quimica', label: 'Innov. Quimica', icon: Beaker },
    { to: '/entregas', label: 'Entregas', icon: Package },
    { to: '/control-bultos', label: 'Control Bultos', icon: Package },
    { to: '/cargar-camiones', label: 'Cargar Camiones', icon: Truck },
    { to: '/control-conduces', label: 'Control Conduces', icon: CheckSquare },
    { to: '/clientes', label: 'Clientes', icon: Building },
    { to: '/usuarios', label: 'Usuarios', icon: Users },
  ];

  const linksToRender = links || defaultLinks;

  if (mobile) {
    return (
      <div className="md:hidden bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex overflow-x-auto space-x-1 scrollbar-hide">
          {linksToRender.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap min-w-fit",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const dashboardLinks = linksToRender.filter(link => link.to === '/');
  
  const labPaths = ['/lam', '/fersuaz', '/taapharmaceutica', '/innovacion-quimica'];
  const labLinks = linksToRender.filter(link => labPaths.includes(link.to));
  const isLabActive = labPaths.includes(location.pathname);
  
  const opPaths = ['/entregas', '/control-bultos', '/cargar-camiones', '/control-conduces'];
  const opLinks = linksToRender.filter(link => opPaths.includes(link.to));
  const isOpActive = opPaths.includes(location.pathname);
  
  const adminPaths = ['/clientes', '/usuarios'];
  const adminLinks = linksToRender.filter(link => adminPaths.includes(link.to));
  const isAdminActive = adminPaths.includes(location.pathname);

  const NavItem = ({ 
    isActive, 
    icon: Icon, 
    label, 
    hasDropdown = false 
  }: { 
    isActive: boolean, 
    icon: any, 
    label: string, 
    hasDropdown?: boolean 
  }) => (
    <div className={cn(
      "flex flex-col items-center justify-center px-3 py-2 rounded-md text-xs font-medium transition-colors min-w-[70px] cursor-pointer group",
      isActive
        ? "bg-white/20 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    )}>
      <Icon className="h-5 w-5 mb-1" />
      <span className="flex items-center gap-1">
        {label}
        {hasDropdown && <ChevronDown className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />}
      </span>
    </div>
  );

  return (
    <nav className="hidden md:flex space-x-2 items-center">
      {dashboardLinks.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.to;
        return (
          <Link key={link.to} to={link.to}>
            <NavItem isActive={isActive} icon={Icon} label={link.label} />
          </Link>
        );
      })}

      {labLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <NavItem isActive={isLabActive} icon={Beaker} label="Laboratorios" hasDropdown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48 bg-white text-gray-800 shadow-lg border-gray-200">
            {labLinks.map((link) => {
              const Icon = link.icon;
              return (
                <DropdownMenuItem key={link.to} asChild className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700">
                  <Link to={link.to} className="flex items-center w-full p-2">
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {opLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <NavItem isActive={isOpActive} icon={Activity} label="Operaciones" hasDropdown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48 bg-white text-gray-800 shadow-lg border-gray-200">
            {opLinks.map((link) => {
              const Icon = link.icon;
              return (
                <DropdownMenuItem key={link.to} asChild className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700">
                  <Link to={link.to} className="flex items-center w-full p-2">
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {adminLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <NavItem isActive={isAdminActive} icon={Settings} label="Administración" hasDropdown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48 bg-white text-gray-800 shadow-lg border-gray-200">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <DropdownMenuItem key={link.to} asChild className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700">
                  <Link to={link.to} className="flex items-center w-full p-2">
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
};

export default NavigationLinks;
