import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw, Trash2, Home, Sparkles } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isChunkError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || error?.toString() || '';
    const isChunk =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Expected a JavaScript-or-Wasm module script') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    return { hasError: true, error, isChunkError: isChunk };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);

    const msg = error?.message || error?.toString() || '';
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Expected a JavaScript-or-Wasm module script') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      console.warn('⚠️ Chunk load error detectado (nueva versión desplegada). Recargando con anti-caché...');
      const reloadKey = 'last_chunk_reload_ts';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(reloadKey, now.toString());
        const cleanUrl = window.location.origin + window.location.pathname;
        window.location.href = `${cleanUrl}?_t=${now}`;
      }
    }
  }

  private handleHardReload = () => {
    try {
      sessionStorage.removeItem('last_chunk_reload_ts');
      sessionStorage.removeItem('last_vite_preload_ts');
    } catch (e) {
      // safe ignore
    }
    const cleanUrl = window.location.origin + window.location.pathname;
    window.location.href = `${cleanUrl}?_t=${Date.now()}`;
  };

  private handleClearCacheAndReload = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('royal_monitoreo_active_cache');
      localStorage.removeItem('royal_conduces_optimized_cache');
      localStorage.removeItem('royal_conduces_optimized_cache_time');
      localStorage.removeItem('royal_clientes_cache');
      localStorage.removeItem('royal_clientes_cache_time');
      localStorage.removeItem('royal_users_cache');
    } catch (e) {
      // safe ignore
    }
    const cleanUrl = window.location.origin + window.location.pathname;
    window.location.href = `${cleanUrl}?_t=${Date.now()}`;
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const isChunk = this.state.isChunkError;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
          <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl text-center space-y-6 border border-slate-100">
            <div className="flex justify-center">
              <div className={`p-3.5 rounded-full ${isChunk ? 'bg-blue-100 text-royal-blue' : 'bg-red-100 text-red-500'}`}>
                {isChunk ? <Sparkles className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isChunk ? '¡Nueva versión disponible!' : '¡Ups! Algo salió mal'}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {isChunk
                  ? 'Hemos actualizado el sistema con nuevas mejoras. Por favor, pulsa el botón para cargar la versión más reciente.'
                  : 'Ocurrió un problema temporal al cargar los datos de esta pantalla. Puedes recargar o limpiar los datos almacenados.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <Button 
                onClick={this.handleHardReload} 
                className="w-full h-11 text-sm font-semibold gap-2 bg-royal-blue hover:bg-royal-blue/90 text-white shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {isChunk ? 'Actualizar a la última versión' : 'Recargar página'}
              </Button>

              <Button 
                variant="outline"
                onClick={this.handleClearCacheAndReload} 
                className="w-full h-10 text-xs font-medium gap-2 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                Limpiar datos en caché y reintentar
              </Button>

              <Button 
                variant="ghost"
                onClick={this.handleGoHome} 
                className="w-full h-9 text-xs font-medium gap-1.5 text-slate-500 hover:text-slate-800"
              >
                <Home className="w-3.5 h-3.5" />
                Ir al Dashboard principal
              </Button>
            </div>
            
            {this.state.error && (
              <details className="mt-4 pt-3 border-t border-slate-100 text-left">
                <summary className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer select-none">
                  Detalles técnicos del error
                </summary>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-red-600 overflow-auto max-h-36 whitespace-pre-wrap break-all">
                  {this.state.error.message || this.state.error.toString()}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
