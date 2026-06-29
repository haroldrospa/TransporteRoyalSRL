
interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const getCurrentPosition = (options: GeolocationOptions = {}): Promise<GeolocationCoordinates> => {
    const defaultOptions: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0, // Siempre pedir ubicación nueva, nunca usar caché
      ...options
    };

    console.log('Getting current position with options:', defaultOptions);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('La geolocalización no está disponible en su navegador');
        console.error(error);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          console.log('Position obtained successfully:', position.coords);
          resolve(position.coords);
        },
        error => {
          console.error('Geolocation error:', error.code, error.message);
          
          let errorMessage = 'Error al obtener ubicación';
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Permiso GPS denegado. Por favor:\n1. Haga clic en el icono de candado en la barra de direcciones\n2. Active los permisos de ubicación\n3. Intente nuevamente';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'No se puede obtener su ubicación. Asegúrese de tener el GPS activado en su dispositivo.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Se agotó el tiempo esperando la ubicación. Intente nuevamente.';
              break;
          }
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  };

  return { getCurrentPosition };
};
