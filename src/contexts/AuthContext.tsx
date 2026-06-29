import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PuestoType } from '@/types/usuarios';

export type User = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  nivel: number;
  puesto: PuestoType;
  camion?: string;
  laboratorio?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from storage on mount so navigation/remounts don't log the user out.
    // "Recordar mi sesión" only controls whether the session survives a full browser close:
    // - true  => persisted in localStorage (auto-login on next visit)
    // - false => kept only in sessionStorage (cleared when the browser tab/window closes)
    const rememberedSession = localStorage.getItem('royal_remember_session') === 'true';
    const storedUser =
      localStorage.getItem('royal_user') || sessionStorage.getItem('royal_user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('royal_user');
        sessionStorage.removeItem('royal_user');
      }

      // If they didn't ask to be remembered across browser sessions, migrate the
      // persisted copy to sessionStorage so it won't auto-login next time.
      if (!rememberedSession) {
        const value = storedUser;
        sessionStorage.setItem('royal_user', value);
        localStorage.removeItem('royal_user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Iniciando autenticación para', email);
      
      // Utilizar la función de base de datos en lugar de consulta directa
      const { data, error } = await supabase
        .rpc('check_user_credentials', {
          email_param: email,
          password_param: password
        })
        .maybeSingle();

      if (error) {
        console.error('Error al autenticar usuario:', error);
        throw new Error(`Error al autenticar: ${error.message}`);
      }
      
      if (!data) {
        console.log('Credenciales incorrectas');
        throw new Error('Credenciales incorrectas');
      }
      
      console.log('Usuario autenticado:', data);
      const userData = data as User;
      setUser(userData);
      const serialized = JSON.stringify(userData);
      const rememberedSession = localStorage.getItem('royal_remember_session') === 'true';
      if (rememberedSession) {
        localStorage.setItem('royal_user', serialized);
        sessionStorage.removeItem('royal_user');
      } else {
        sessionStorage.setItem('royal_user', serialized);
        localStorage.removeItem('royal_user');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('royal_user');
    sessionStorage.removeItem('royal_user');
    // Keep the remembered email if remember session is true
    const rememberedSession = localStorage.getItem('royal_remember_session') === 'true';
    const rememberedEmail = localStorage.getItem('royal_remembered_email');
    
    if (!rememberedSession || !rememberedEmail) {
      // If remember session is false, also clear the remembered email
      localStorage.removeItem('royal_remembered_email');
      localStorage.removeItem('royal_remember_session');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
