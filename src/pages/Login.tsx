
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ShieldCheck, Truck, MapPin } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberSession, setRememberSession] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for remembered credentials on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('royal_remembered_email');
    const rememberedSession = localStorage.getItem('royal_remember_session') === 'true';
    
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberSession(rememberedSession);
    }
    
    // If user is already authenticated and we have remembered session, redirect to home
    if (isAuthenticated && rememberedSession) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(email, password);
      
      // Save email if remember session is checked
      if (rememberSession) {
        localStorage.setItem('royal_remembered_email', email);
        localStorage.setItem('royal_remember_session', 'true');
      } else {
        // Clear remembered credentials if unchecked
        localStorage.removeItem('royal_remembered_email');
        localStorage.removeItem('royal_remember_session');
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error de login:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error de autenticación');
      toast({
        title: 'Error de inicio de sesión',
        description: error instanceof Error ? error.message : 'Credenciales incorrectas. Por favor, intente nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="min-h-screen relative flex items-center justify-center bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat bg-royal-blue overflow-hidden">
      
      {/* Mensajes flotantes alrededor (Solo en Desktop) */}
      <div className="hidden lg:flex absolute top-[25%] left-8 2xl:left-24 z-0 animate-float">
        <div className="max-w-[280px] bg-royal-blue/70 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.3)] animate-fade-in transition-transform hover:scale-105 duration-300">
          <div className="flex items-center gap-4">
            <div className="bg-royal-yellow/20 p-3 rounded-full flex-shrink-0 shadow-[0_0_15px_rgba(245,185,66,0.3)]">
              <ShieldCheck size={26} className="text-royal-yellow" />
            </div>
            <span className="text-white font-medium text-sm leading-snug">Transporte seguro</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex absolute bottom-[20%] left-12 2xl:left-32 z-0 animate-float" style={{ animationDelay: '1s' }}>
        <div className="max-w-[300px] bg-royal-blue/70 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.3)] animate-fade-in transition-transform hover:scale-105 duration-300" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-4">
            <div className="bg-royal-yellow/20 p-3 rounded-full flex-shrink-0 shadow-[0_0_15px_rgba(245,185,66,0.3)]">
              <MapPin size={26} className="text-royal-yellow" />
            </div>
            <span className="text-white font-medium text-sm leading-snug">Sistema de trazabilidad para rastreo y cargas</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex absolute top-[35%] right-8 2xl:right-24 z-0 animate-float" style={{ animationDelay: '2s' }}>
        <div className="max-w-[280px] bg-royal-blue/70 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.3)] animate-fade-in transition-transform hover:scale-105 duration-300" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-4">
            <div className="bg-royal-yellow/20 p-3 rounded-full flex-shrink-0 shadow-[0_0_15px_rgba(245,185,66,0.3)]">
              <Truck size={26} className="text-royal-yellow" />
            </div>
            <span className="text-white font-medium text-sm leading-snug">Unidades exclusivas para productos farmacéuticos</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md animate-fade-in px-6 mt-16 lg:mt-0 relative z-10">
        <div className="relative bg-opacity-10 backdrop-blur-md bg-white/10 p-8 pt-16 shadow-xl rounded-2xl px-[15px] pb-[21px] my-0">
          
          {/* Caja del logo que sobresale - Hecha más grande */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-royal-blue p-6 px-8 rounded-2xl shadow-xl border border-white/10 flex items-center justify-center w-3/4 max-w-[280px]">
            <Logo />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-0 mt-4">
            {errorMessage && <div className="p-3 rounded-md bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                {errorMessage}
              </div>}

            <div className="space-y-5">
              <div>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Email address" 
                  className="w-full bg-white/5 backdrop-blur-sm text-white border-white/10 placeholder:text-gray-400 text-sm rounded-xl focus:ring-royal-yellow/50 focus:border-royal-yellow/50 h-12" 
                  required 
                />
              </div>

              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Password" 
                  className="w-full bg-white/5 backdrop-blur-sm text-white border-white/10 placeholder:text-gray-400 text-sm rounded-xl focus:ring-royal-yellow/50 focus:border-royal-yellow/50 h-12 pr-12" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberSession} 
                  onCheckedChange={(checked) => setRememberSession(checked === true)}
                  className="data-[state=checked]:bg-royal-yellow data-[state=checked]:border-royal-yellow" 
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm text-white cursor-pointer"
                >
                  Recordar mi sesión
                </Label>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-royal-yellow hover:bg-royal-yellow/90 text-royal-blue font-semibold rounded-xl text-base transition-all duration-200">
              {isLoading ? <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-royal-blue border-t-transparent rounded-full animate-spin mr-2" />
                  Iniciando sesión...
                </div> : 'Log in'}
            </Button>
          </form>
        </div>

      </div>
      
      {/* Footer inferior */}
      <div className="absolute bottom-6 left-0 w-full text-center z-0">
        <p className="text-white/40 text-xs font-medium tracking-wide">© 2026 Transporte Royal • Experto en transporte y Logistica</p>
      </div>
    </div>;
};

export default Login;
