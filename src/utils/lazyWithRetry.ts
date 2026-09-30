import React from 'react';

/**
 * Enhanced React.lazy wrapper that automatically catches chunk load errors
 * (typically caused by new production deployments replacing chunk hashes)
 * and refreshes the page once to load the latest version seamlessly.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const component = await componentImport();
      return component.default ? component : { default: component };
    } catch (error: any) {
      console.warn('⚠️ Error al cargar componente diferido (posible nueva versión desplegada):', error);
      
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Expected a JavaScript-or-Wasm module script') ||
        error?.message?.includes('error loading dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError) {
        const reloadKey = 'last_chunk_reload_ts';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();
        
        // Auto-recargar si no se ha recargado en los últimos 15 segundos
        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          sessionStorage.setItem(reloadKey, now.toString());
          console.log('🔄 Recargando la aplicación para obtener los nuevos recursos desplegados...');
          window.location.reload();
          // Retornar una promesa pendiente para mantener el fallback del Suspense hasta que recargue
          return new Promise<{ default: T }>(() => {});
        }
      }
      
      throw error;
    }
  });
}
