import { useState, useEffect } from 'react';
import { Truck, Package, Sparkles } from 'lucide-react';

interface CargarCamionesLoadingScreenProps {
  message?: string;
}

const statusSteps = [
  "Conectando con la base de datos...",
  "Cargando conduces y bultos en tránsito...",
  "Organizando camiones y encomendados...",
  "Sincronizando registros de escaneo...",
  "Preparando estación de carga..."
];

const CargarCamionesLoadingScreen = ({ message }: CargarCamionesLoadingScreenProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % statusSteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 select-none animate-fade-in">
      {/* Background ambient glow */}
      <div className="relative flex flex-col items-center max-w-md w-full">
        <div className="absolute -top-12 -z-10 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute top-10 -z-10 h-40 w-40 rounded-full bg-royal-blue/10 blur-2xl" />

        {/* Truck & Cargo Animation Stage */}
        <div className="relative w-64 h-36 flex flex-col items-center justify-end pb-4 mb-3">
          {/* Floating / Loading Packages Animation */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {/* Floating Package 1 */}
            <div className="animate-bounce [animation-delay:0ms] duration-1000 flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 shadow-sm text-amber-600">
              <Package className="h-4 w-4" />
            </div>
            {/* Floating Package 2 */}
            <div className="animate-bounce [animation-delay:300ms] duration-1000 flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 shadow-sm text-royal-blue">
              <Package className="h-3.5 w-3.5" />
            </div>
            {/* Floating Sparkle */}
            <div className="animate-bounce [animation-delay:600ms] duration-1000 flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 shadow-sm text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          {/* Truck Body with subtle bounce */}
          <div className="relative flex items-center justify-center">
            {/* Truck Card Container */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60 shadow-lg shadow-blue-500/5 animate-pulse">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal-blue text-white shadow-md shadow-royal-blue/30 shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div className="flex flex-col text-left pr-2">
                <span className="text-[10px] font-bold tracking-wider text-royal-blue/80 dark:text-blue-400 uppercase">Transporte Royal</span>
                <span className="text-xs font-extrabold text-foreground">Carga de Camiones</span>
              </div>
            </div>
          </div>

          {/* Animated Road / Ground with moving dashes */}
          <div className="w-56 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-royal-blue to-transparent w-24 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Text Header */}
        <div className="text-center space-y-2 mt-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
            {message || "Cargando Sistema de Camiones"}
          </h2>
          
          {/* Dynamic Stepped Status Message */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-xs sm:text-sm text-muted-foreground transition-all duration-300 animate-fade-in font-medium flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-royal-blue animate-ping" />
              {statusSteps[currentStepIndex]}
            </p>
          </div>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-56 sm:w-64 h-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden mt-5 relative border border-border/40">
          <div className="h-full bg-gradient-to-r from-blue-400 via-royal-blue to-blue-500 rounded-full w-2/3 animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default CargarCamionesLoadingScreen;
