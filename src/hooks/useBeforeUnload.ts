import { useEffect, useCallback } from 'react';

/**
 * Hook to warn user before leaving the page if there are unsaved changes
 */
export function useBeforeUnload(shouldWarn: boolean, message?: string) {
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (!shouldWarn) return;
    
    event.preventDefault();
    // Chrome requires returnValue to be set
    event.returnValue = message || '¿Estás seguro que deseas salir? Tienes cambios pendientes de sincronizar.';
    return event.returnValue;
  }, [shouldWarn, message]);

  useEffect(() => {
    if (shouldWarn) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [shouldWarn, handleBeforeUnload]);
}
