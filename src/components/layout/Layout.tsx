
import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import NavigationLinks, { getNavLinks } from './NavigationLinks';
import { useIsMobile } from '@/hooks/use-mobile';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Always call hooks before any conditional returns
  useEffect(() => {
    if (loading || !user) return;

    // Para choferes: siempre redirigir a entregas si están en cualquier otra página
    if (user?.puesto === 'Chofer' && location.pathname !== '/entregas') {
      navigate('/entregas');
    }
    // Para escaneador de bultos: solo acceso a cargar camiones
    if ((user?.puesto === 'Escaneador de bultos' || user?.nivel === 7) && location.pathname !== '/cargar-camiones') {
      navigate('/cargar-camiones');
    }
    // Para escaneador de conduces (y despachador): acceso a control de bultos y cargar camiones
    if (
      (user?.puesto === 'Escaneador de conduces' || user?.puesto === 'Despachador' || user?.nivel === 3) && 
      !['/control-bultos', '/cargar-camiones'].includes(location.pathname)
    ) {
      navigate('/cargar-camiones');
    }
    // For level 6 users, redirect to LAM if they're on an unauthorized page
    if (user?.nivel === 6 && !['/lam', '/fersuaz', '/taapharmaceutica', '/innovacion-quimica', '/krishpar', '/crear-conduces', '/entregas', '/monitoreo'].includes(location.pathname)) {
      navigate('/lam');
    }
  }, [user, loading, location.pathname, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-3 border-royal-blue/30 border-t-royal-blue rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  const navLinks = getNavLinks(user);
  
  return (
    <div className="min-h-screen flex flex-col bg-background" translate="no">
      <Header user={user} onLogout={logout} />
      
      {/* Mobile navigation is handled entirely by the Sidebar (MobileMenu) inside Header */}
      
      <main className={`flex-1 w-full max-w-[1800px] mx-auto py-3 ${isMobile ? 'px-2' : 'px-4 md:px-6 lg:px-8'} overflow-x-hidden`}>
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
