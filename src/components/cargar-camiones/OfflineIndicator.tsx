import { WifiOff, RefreshCw, CloudOff, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onSync?: () => void;
}

const OfflineIndicator = ({ 
  isOnline, 
  pendingSyncCount, 
  isSyncing, 
  onSync 
}: OfflineIndicatorProps) => {
  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
      isOnline 
        ? "bg-amber-100 text-amber-800 border border-amber-200" 
        : "bg-red-100 text-red-800 border border-red-200"
    )}>
      {isOnline ? (
        <>
          <CloudOff className="h-4 w-4" />
          <span>{pendingSyncCount} pendiente{pendingSyncCount !== 1 ? 's' : ''}</span>
          {onSync && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onSync}
              disabled={isSyncing}
              className="h-6 px-2 ml-1"
            >
              <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Modo Offline</span>
          {pendingSyncCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-red-200 text-red-900 flex items-center gap-1">
              <Database className="h-3 w-3" />
              {pendingSyncCount} guardado{pendingSyncCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {pendingSyncCount > 0 && (
            <span className="text-xs opacity-75 ml-1">(persistido localmente)</span>
          )}
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
