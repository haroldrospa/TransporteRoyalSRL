import { Truck, Package, Loader2 } from 'lucide-react';

interface LAMLoadingStateOptimizedProps {
  laboratorio?: string;
}

const LAMLoadingStateOptimized = ({ laboratorio }: LAMLoadingStateOptimizedProps) => {
  return (
    <div className="min-h-[50vh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-transparent">
      
      {/* Main Card */}
      <div className="relative z-10 w-full max-w-sm bg-white border-t-4 border-t-royal-blue border-x border-b border-gray-100 shadow-xl rounded-2xl p-8 flex flex-col items-center text-center">
        
        {/* Animated Icons Container */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          {/* Rotating dashed rings */}
          <div className="absolute inset-0 border-[3px] border-dashed border-royal-blue/30 rounded-full animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-2 border-[3px] border-dashed border-royal-yellow/60 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
          
          {/* Central Icon */}
          <div className="relative w-14 h-14 bg-royal-blue rounded-2xl flex items-center justify-center shadow-lg shadow-royal-blue/30 rotate-3">
            <Package className="h-7 w-7 text-royal-yellow animate-pulse" />
          </div>
        </div>

        {/* Text Section */}
        <h2 className="text-xl font-bold text-royal-blue tracking-tight mb-2">
          Preparando entregas
        </h2>
        
        <p className="text-sm text-gray-500 font-medium mb-6 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-royal-yellow" />
          {laboratorio ? `Cargando datos de ${laboratorio}...` : 'Sincronizando sistema...'}
        </p>

        {/* Brand Progress Bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-royal-blue w-full animate-[indeterminate-progress_1.5s_ease-in-out_infinite] origin-left relative">
            <div className="absolute top-0 right-0 bottom-0 w-1/4 bg-royal-yellow rounded-l-full" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes indeterminate-progress {
          0% { transform: translateX(-100%) scaleX(0.2); }
          50% { transform: translateX(0%) scaleX(0.5); }
          100% { transform: translateX(100%) scaleX(0.2); }
        }
      `}</style>
    </div>
  );
};

export default LAMLoadingStateOptimized;