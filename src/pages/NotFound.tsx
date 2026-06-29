
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/layout/Logo";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-4 sm:p-6">
      <div className="bg-royal-blue p-3 rounded-xl mb-6">
        <Logo />
      </div>
      
      <div className="w-full max-w-md space-y-6 text-center animate-fade-in">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold text-royal-blue">404</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2 mb-6 sm:mb-8">Oops! Página no encontrada</p>
        </div>
        
        <p className="text-muted-foreground px-4">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        
        <div className="mt-6 sm:mt-8">
          <Button
            asChild
            className="bg-royal-blue hover:bg-royal-blue/90 w-full sm:w-auto"
          >
            <Link to={user ? "/" : "/login"}>
              Volver al {user ? "Inicio" : "Login"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
