import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">¡Ups! Algo salió mal</h2>
              <p className="text-gray-500 text-sm">
                Hemos actualizado la aplicación y tu navegador podría tener una versión antigua.
                Por favor, recarga la página para solucionar este problema.
              </p>
            </div>

            <Button 
              onClick={() => window.location.reload()} 
              className="w-full h-12 text-base gap-2 bg-royal-blue hover:bg-royal-blue/90"
            >
              <RefreshCw className="w-5 h-5" />
              Recargar página
            </Button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto text-xs text-red-600 max-h-40">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
