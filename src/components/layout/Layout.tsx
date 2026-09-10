
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

    // For drivers, always redirect to entregas page if they're on home page
    if (user?.puesto === 'Chofer' && location.pathname === '/') {
      navigate('/entregas');
    }
    // For dispatchers, always redirect to cargar-camiones page if they're on any other page
    if (user?.puesto === 'Despachador' && location.pathname !== '/cargar-camiones') {
      navigate('/cargar-camiones');
    }
    // For level 6 users, redirect to LAM if they're on an unauthorized page
    if (user?.nivel === 6 && !['/lam', '/fersuaz', '/taapharmaceutica', '/innovacion-quimica', '/krishpar', '/crear-conduces', '/entregas'].includes(location.pathname)) {
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
